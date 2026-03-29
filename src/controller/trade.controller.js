import Trade from "../models/Trade.js";
import User from "../models/User.js";
import OrderHistory from "../models/Order.js";
import moment from "moment";
import { Op, Sequelize } from "sequelize";
import { getLTP } from "../services/upstox.service.js";

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
  // const marketOpen = req.isMarketOpen;
  const marketOpen = true; //just for simulation
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
  const trades = await Trade.findAll({
    where: {
      user_id: user.id,
    },
  });
  return res.status(200).json({
    message: "Trades fetched successfully",
    success: true,
    data: trades,
  });
};
