import Trade from "../models/Trade.js";
import User from "../models/User.js";
import Stock from "../models/stock.js";
import OrderHistory from "../models/Order.js";
import moment from "moment";
import { Op, Sequelize } from "sequelize";
import { getLTP } from "../services/upstox.service.js";
import dbManager from "../config/DatabaseManager.js";

//validate all inputs ✅
//check if user has enough balance ✅
//deduct/add balance in case of live order ✅
//check if user has complementary trade in history which is status=open ✅
// if yes then do changes in the old trade and quantity wise if needed make new entry with remaining quantity ✅
//get live price using the LTP api ✅
//save trade according to the timing and status ✅
// return trade object ✅

export const registerTrade = async (req, resp) => {
  const user = req.user;
  const marketOpen = req.isMarketOpen;
  // const marketOpen = false; //just for simulation
  const { instrument_key, trade_type, trade_duration, quantity } = req.body;
  let finalQuantity = quantity; //initially assume full quantity will be traded
  if (!instrument_key) {
    return resp.status(400).json({
      message: "instrument_key is required",
      success: false,
    });
  }
  if (!trade_type) {
    return resp.status(400).json({
      message: "trade_type is required",
      success: false,
    });
  }
  if (trade_type !== "buy" && trade_type !== "sell") {
    return resp.status(400).json({
      message: "invalid trade type ",
      success: false,
    });
  }
  if (!trade_duration) {
    return resp.status(400).json({
      message: "trade_duration is required",
      success: false,
    });
  }
  if (trade_duration !== "intraday" && trade_duration !== "delivery") {
    return resp.status(400).json({
      message: "invalid trade duration ",
      success: false,
    });
  }
  if (!quantity) {
    return resp.status(400).json({
      message: "required quantity",
      success: false,
    });
  }
  if (quantity <= 0) {
    return resp.status(400).json({
      message: "invalid quantity ",
      success: false,
    });
  }

  //status has to be decided here
  const orderStatus = marketOpen ? "open" : "pending";

  //is_after_market_order  has to be decided here  , if yes then add in response so frontend can show alert order is placed as AMO
  const isAfterMarketOrder = !marketOpen;

  // order_type by default market only for now
  const orderType = "market";

  // entry_price get by api
  let currentPrice = null;
  if (marketOpen) {
    const ltpData = await getLTP(instrument_key);
    // Extract values from the data object to handle dynamic keys dynamically
    if (ltpData && ltpData.data) {
      const quotes = Object.values(ltpData.data);
      if (quotes.length > 0) {
        currentPrice = quotes[0].last_price;
      }
    }
  }
  console.log(currentPrice);

  // executedAt if trade is placed in market hours else null
  const executedAt = marketOpen ? moment().format("YYYY-MM-DD HH:mm:ss") : null;

  //total_entry_value
  let totalEntryValue = null;

  if (marketOpen)
    totalEntryValue = (
      currentPrice *
      quantity *
      (trade_type === "buy" ? -1 : 1)
    ).toFixed(2); //negative in case of buy
  //total_exit_value
  //check if user has complementary trade in history which is status=open

  if (marketOpen) {
    // Fetch ALL complementary open trades (oldest first) to drain them greedily
    const complementaryTrades = await Trade.findAll({
      where: {
        user_id: user.id,
        instrument_key: instrument_key,
        trade_type: trade_type === "buy" ? "sell" : "buy",
        status: "open",
      },
      order: [["createdAt", "ASC"]],
    });

    //check users balance
    const userFindById = await User.findByPk(user.id);
    const balance = parseFloat(userFindById.funds);
    if (balance < -parseFloat(totalEntryValue)) {
      //enter a failed order
      await OrderHistory.create({
        user_id: user.id,
        instrument_key: instrument_key,
        trade_type: trade_type,
        trade_duration: trade_duration,
        is_after_market_order: isAfterMarketOrder,
        status: "failed",
        order_type: orderType,
        quantity: quantity,
        executedAt: executedAt,
      });
      return resp.status(400).json({
        message: "insufficient balance",
        success: false,
      });
    }
    userFindById.funds = (balance + parseFloat(totalEntryValue)).toFixed(2);
    userFindById.save();

    // log order as executed
    await OrderHistory.create({
      user_id: user.id,
      instrument_key: instrument_key,
      trade_type: trade_type,
      trade_duration: trade_duration,
      is_after_market_order: isAfterMarketOrder,
      status: "executed",
      order_type: orderType,
      quantity: quantity,
      executedAt: executedAt,
    });

    // Greedily drain complementary trades one by one
    let remainingQty = quantity;

    for (const ct of complementaryTrades) {
      if (remainingQty <= 0) break;

      if (ct.quantity <= remainingQty) {
        // fully settle this complementary trade
        remainingQty -= ct.quantity;
        ct.total_exit_value = (
          parseFloat(ct.total_exit_value ?? 0) +
          parseFloat(currentPrice) *
            parseFloat(ct.quantity) *
            (trade_type === "buy" ? -1 : 1)
        ).toFixed(2);
        ct.exit_price = currentPrice;
        ct.status = "settled";
        ct.quantity = 0;
        await ct.save();
      } else {
        // partially settle — complementary trade still has qty left
        ct.total_exit_value = (
          parseFloat(ct.total_exit_value ?? 0) +
          parseFloat(currentPrice) *
            parseFloat(remainingQty) *
            (trade_type === "buy" ? -1 : 1)
        ).toFixed(2);
        ct.exit_price = currentPrice;
        ct.quantity = ct.quantity - remainingQty;
        remainingQty = 0;
        await ct.save();
      }
    }

    if (remainingQty > 0) {
      // After draining all complementary trades there's still qty left — open a new trade
      const newTrade = await Trade.create({
        user_id: user.id,
        instrument_key: instrument_key,
        trade_type: trade_type,
        trade_duration: trade_duration,
        quantity: remainingQty,
        status: orderStatus,
        executedAt: executedAt,
        is_after_market_order: isAfterMarketOrder,
        order_type: orderType,
        entry_price: currentPrice,
        exit_price: null,
        total_entry_value: (
          currentPrice *
          remainingQty *
          (trade_type === "buy" ? -1 : 1)
        ).toFixed(2),
        total_exit_value: null,
      });
      return resp.status(200).json({
        message: "Trade registered successfully",
        type:
          complementaryTrades.length > 0
            ? "new_trade_with_settled_old_trades"
            : "new_trade_full_quantity",
        success: true,
        data: newTrade,
      });
    }

    return resp.status(200).json({
      message: "Trade registered successfully",
      type: "settled_complementary_trades",
      success: true,
    });
  } else {
    // make fresh order will be executed by cron job at 9:15 AM
    const newOrder = await OrderHistory.create({
      user_id: user.id,
      instrument_key: instrument_key,
      trade_type: trade_type,
      trade_duration: trade_duration,
      is_after_market_order: isAfterMarketOrder,
      status: "pending",
      order_type: orderType,
      quantity: quantity,
      executedAt: executedAt,
    });
    return resp.status(200).json({
      message: "Order placed successfully",
      type: "after_market_order",
      success: true,
      data: newOrder,
    });
  }
};

export const getTrades = async (req, res) => {
  const user = req.user;
  const [trades] = await dbManager
    .getInstance()
    .query(`select * from get_user_open_trades_report(${user.id})`);
  const intraday = trades[0].get_user_open_trades_report?.intraday;
  const delivery = trades[0].get_user_open_trades_report?.delivery;
  const open_orders = trades[0].get_user_open_trades_report?.open_orders;

  //get live prices for all the stocks in intraday and delivery and open orders
  const ltpForIntraday =
    intraday?.length > 0
      ? await getLTP(intraday?.map((trade) => trade.instrument_key))
      : null;
  const ltpForDelivery =
    delivery?.length > 0
      ? await getLTP(delivery?.map((trade) => trade.instrument_key))
      : null;
  const ltpForOpenOrders =
    open_orders?.length > 0
      ? await getLTP(open_orders?.map((trade) => trade.instrument_key))
      : null;

  //add ltp to the trades
  intraday &&
    intraday?.forEach((trade) => {
      trade.ltp = Object.values(ltpForIntraday.data).find(
        (ltp) => ltp.instrument_token === trade.instrument_key,
      );
    });
  delivery &&
    delivery?.forEach((trade) => {
      trade.ltp = Object.values(ltpForDelivery.data).find(
        (ltp) => ltp.instrument_token === trade.instrument_key,
      );
    });
  open_orders &&
    open_orders?.forEach((trade) => {
      trade.ltp = Object.values(ltpForOpenOrders.data).find(
        (ltp) => ltp.instrument_token === trade.instrument_key,
      );
    });
  return res.status(200).json({
    message: "Trades fetched successfully",
    success: true,
    data: { intraday, delivery, open_orders },
  });
};

export const getUserFunds = async (req, res) => {
  const user = req.user;
  const userFunds = await User.findOne({
    where: {
      id: user.id,
    },
    attributes: ["funds"],
  });
  return res.status(200).json({
    message: "Funds fetched successfully",
    success: true,
    data: userFunds,
  });
};

export const getUserTradeHistory = async (req, res) => {
  const user = req.user;
  const userFunds = await OrderHistory.findAll({
    where: {
      user_id: user.id,
    },
    include: [
      {
        model: Stock, // Specify the model to include
      },
    ],
    order: [["createdAt", "DESC"]],
  });
  return res.status(200).json({
    message: "Trade history fetched successfully",
    success: true,
    data: userFunds,
  });
};

export const cancelAMOorder = async (req, res) => {
  const { orderId } = req.body;
  const user = req.user;
  const order = await OrderHistory.findOne({
    where: {
      id: orderId,
      user_id: user.id,
    },
  });
  if (!order) {
    return res.status(404).json({
      message: "Order not found",
      success: false,
    });
  }
  if (order.status !== "pending") {
    return res.status(400).json({
      message: "Order is not pending",
      success: false,
    });
  }
  order.status = "cancelled";
  await order.save();
  return res.status(200).json({
    message: "Order cancelled successfully",
    success: true,
    data: order,
  });
};

export const settleTrade = async (req, res) => {
  const user = req.user;
  const marketOpen = req.isMarketOpen;
  const { instrument_key, trade_type, trade_duration } = req.body;

  // --- Input validation ---
  if (!instrument_key) {
    return res
      .status(400)
      .json({ message: "instrument_key is required", success: false });
  }
  if (!trade_type || (trade_type !== "buy" && trade_type !== "sell")) {
    return res.status(400).json({
      message: "valid trade_type (buy/sell) is required",
      success: false,
    });
  }
  if (
    !trade_duration ||
    (trade_duration !== "intraday" && trade_duration !== "delivery")
  ) {
    return res.status(400).json({
      message: "valid trade_duration (intraday/delivery) is required",
      success: false,
    });
  }

  try {
    // Find all open trades matching the criteria
    const trades = await Trade.findAll({
      where: {
        user_id: user.id,
        instrument_key: instrument_key,
        trade_type: trade_type,
        trade_duration: trade_duration,
        status: "open",
      },
    });

    //for debug
    console.log(
      "trade id",
      trades.map((trade) => ` ${trade.id} ,`),
    );
    const stockInfo = await Stock.findOne({
      where: {
        instrument_key: instrument_key,
      },
    });

    if (!trades || trades.length === 0) {
      return res.status(404).json({
        message: "No open trades found for the given criteria",
        success: false,
      });
    }

    // Fetch the live price
    let currentPrice = null;
    const ltpData = await getLTP(instrument_key);
    if (ltpData && ltpData.data) {
      const quotes = Object.values(ltpData.data);
      if (quotes.length > 0) {
        currentPrice = quotes[0].last_price;
      }
    }
    if (currentPrice === null) {
      return res
        .status(500)
        .json({ message: "Unable to fetch live price", success: false });
    }

    // Calculate total quantity across all matching trades
    const totalQuantity = trades.reduce((sum, t) => sum + t.quantity, 0);

    // The order entry should be the opposite type (settling a buy = sell, settling a sell = buy)
    const orderTradeType = trade_type === "buy" ? "sell" : "buy";

    // in case of closed market make an AMO order and exit
    if (!marketOpen) {
      console.log("market is closed , placing AMO order");
      const order = await OrderHistory.create({
        user_id: user.id,
        instrument_key: instrument_key,
        trade_type: orderTradeType,
        trade_duration: trade_duration,
        is_after_market_order: true,
        status: "pending",
        order_type: "market",
        quantity: totalQuantity,
        executedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });
      return res.status(200).json({
        message: `AMO order placed for ${stockInfo?.name} with Qty:${totalQuantity}`,
        success: true,
        data: order,
      });
    }

    // Create an order history record for this settlement
    await OrderHistory.create({
      user_id: user.id,
      instrument_key: instrument_key,
      trade_type: orderTradeType,
      trade_duration: trade_duration,
      is_after_market_order: false,
      status: "executed",
      order_type: "market",
      quantity: totalQuantity,
      executedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    });

    // Settle each trade and track total exit value to update user funds
    let totalFundsChange = 0;

    for (const trade of trades) {
      const tradeQty = trade.quantity;

      // exit value for this trade: price × quantity
      // If the original trade was a buy, settling (selling) brings money IN  → positive
      // If the original trade was a sell, settling (buying back) takes money OUT → negative
      const exitValue =
        parseFloat(currentPrice) *
        parseFloat(tradeQty) *
        (trade_type === "buy" ? 1 : -1);

      trade.total_exit_value = (
        parseFloat(trade.total_exit_value ?? 0) + exitValue
      ).toFixed(2);
      trade.exit_price = currentPrice;
      trade.status = "settled";
      trade.quantity = 0;
      await trade.save();

      totalFundsChange += exitValue;
    }

    // Update user funds
    const userRecord = await User.findByPk(user.id);
    userRecord.funds = (
      parseFloat(userRecord.funds) + totalFundsChange
    ).toFixed(2);
    await userRecord.save();

    return res.status(200).json({
      message: `All trades settled successfully for ${stockInfo?.name} with Qty:${totalQuantity}`,
      success: true,
      data: {
        settled_count: trades.length,
        total_quantity: totalQuantity,
        exit_price: currentPrice,
        funds_change: totalFundsChange.toFixed(2),
      },
    });
  } catch (error) {
    console.error("settleTrade error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const getPortfolioStats = async (req, res) => {
  const user = req.user;
  const INITIAL_FUNDS = 1000000; // 10 lakh starting capital

  try {
    // 1. Fetch user funds
    const userRecord = await User.findByPk(user.id, {
      attributes: ["funds"],
    });
    const currentFunds = parseFloat(userRecord.funds);

    // 2. Fetch grouped open trades from stored procedure (same as getTrades)
    const [trades] = await dbManager
      .getInstance()
      .query(`select * from get_user_open_trades_report(${user.id})`);

    const intraday = trades[0].get_user_open_trades_report?.intraday || [];
    const delivery = trades[0].get_user_open_trades_report?.delivery || [];

    // Combine all portfolio entries
    const allPositions = [...intraday, ...delivery];

    // 3. Collect unique instrument_keys for a single batch LTP call
    const uniqueKeys = [...new Set(allPositions.map((p) => p.instrument_key))];

    // 4. Fetch live prices in one go (array supported by getLTP)
    let ltpMap = {}; // instrument_key -> last_price
    if (uniqueKeys.length > 0) {
      const ltpData = await getLTP(uniqueKeys);
      if (ltpData && ltpData.data) {
        Object.values(ltpData.data).forEach((quote) => {
          ltpMap[quote.instrument_token] = quote.last_price;
        });
      }
    }

    // 5. Map LTP to each position and calculate totals
    let totalInvested = 0;
    let totalCurrentValue = 0;

    allPositions.forEach((position) => {
      const ltp = ltpMap[position.instrument_key] || 0;
      const qty = parseFloat(position.qty) || 0;
      const investment = parseFloat(position.investment) || 0;

      // Current market value of this position
      const currentValue = qty * ltp;

      totalInvested += investment;
      totalCurrentValue += currentValue;

      // Attach to position for reference
      position.ltp = ltp;
      position.current_value = parseFloat(currentValue.toFixed(2));
    });

    // 6. Compute stats
    const unrealizedPnl = totalCurrentValue - totalInvested;
    const overallPnl = currentFunds + totalInvested - INITIAL_FUNDS;

    return res.status(200).json({
      message: "Portfolio stats fetched successfully",
      success: true,
      data: {
        current_funds: parseFloat(currentFunds.toFixed(2)),
        total_invested: parseFloat(totalInvested.toFixed(2)),
        total_current_value: parseFloat(totalCurrentValue.toFixed(2)),
        unrealized_pnl: parseFloat(unrealizedPnl.toFixed(2)),
        overall_pnl: parseFloat(overallPnl.toFixed(2)),
        // positions: allPositions,
      },
    });
  } catch (error) {
    console.error("getPortfolioStats error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};
