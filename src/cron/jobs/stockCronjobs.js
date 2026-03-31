import moment from "moment";
import { Op } from "sequelize";
import Trade from "../../models/Trade.js";
import User from "../../models/User.js";
import OrderHistory from "../../models/Order.js";
import { getLTP } from "../../services/upstox.service.js";

const getCurrentPrice = async (instrumentKey) => {
  const ltpData = await getLTP(instrumentKey);

  if (!ltpData?.data) {
    return null;
  }

  const quotes = Object.values(ltpData.data);
  return quotes.length > 0 ? Number(quotes[0].last_price) : null;
};

const settleComplementaryTrades = async ({
  complementaryTrades,
  remainingQty,
  currentPrice,
  tradeType,
}) => {
  let pendingQty = remainingQty;

  for (const ct of complementaryTrades) {
    if (pendingQty <= 0) break;

    if (ct.quantity <= pendingQty) {
      pendingQty -= ct.quantity;
      ct.total_exit_value = (
        parseFloat(ct.total_exit_value ?? 0) +
        parseFloat(currentPrice) *
          parseFloat(ct.quantity) *
          (tradeType === "buy" ? -1 : 1)
      ).toFixed(2);
      ct.exit_price = currentPrice;
      ct.status = "settled";
      ct.quantity = 0;
      await ct.save();
      continue;
    }

    ct.total_exit_value = (
      parseFloat(ct.total_exit_value ?? 0) +
      parseFloat(currentPrice) *
        parseFloat(pendingQty) *
        (tradeType === "buy" ? -1 : 1)
    ).toFixed(2);
    ct.exit_price = currentPrice;
    ct.quantity = ct.quantity - pendingQty;
    pendingQty = 0;
    await ct.save();
  }

  return pendingQty;
};

const executeSingleAMOOrder = async (order) => {
  const currentPrice = await getCurrentPrice(order.instrument_key);

  if (!currentPrice) {
    console.error(
      `Skipping AMO order ${order.id}: unable to fetch LTP for ${order.instrument_key}`,
    );
    return;
  }

  const executedAt = moment().format("YYYY-MM-DD HH:mm:ss");
  const totalEntryValue = (
    currentPrice *
    order.quantity *
    (order.trade_type === "buy" ? -1 : 1)
  ).toFixed(2);

  const complementaryTrades = await Trade.findAll({
    where: {
      user_id: order.user_id,
      instrument_key: order.instrument_key,
      trade_type: order.trade_type === "buy" ? "sell" : "buy",
      status: "open",
    },
    order: [["createdAt", "ASC"]],
  });

  const user = await User.findByPk(order.user_id);
  const balance = parseFloat(user.funds);

  if (balance < -parseFloat(totalEntryValue)) {
    order.status = "failed";
    order.executedAt = executedAt;
    await order.save();
    return;
  }

  user.funds = (balance + parseFloat(totalEntryValue)).toFixed(2);
  await user.save();

  let remainingQty = await settleComplementaryTrades({
    complementaryTrades,
    remainingQty: order.quantity,
    currentPrice,
    tradeType: order.trade_type,
  });

  if (remainingQty > 0) {
    await Trade.create({
      user_id: order.user_id,
      instrument_key: order.instrument_key,
      trade_type: order.trade_type,
      trade_duration: order.trade_duration,
      quantity: remainingQty,
      status: "open",
      executedAt,
      is_after_market_order: order.is_after_market_order,
      order_type: order.order_type,
      entry_price: currentPrice,
      exit_price: null,
      total_entry_value: (
        currentPrice *
        remainingQty *
        (order.trade_type === "buy" ? -1 : 1)
      ).toFixed(2),
      total_exit_value: null,
    });
  }

  order.status = "executed";
  order.executedAt = executedAt;
  await order.save();
};

export const executeAMOorders = async () => {
  console.log("Executing AMO orders...");

  const pendingOrders = await OrderHistory.findAll({
    where: {
      status: "pending",
      is_after_market_order: true,
      [Op.or]: [{ executedAt: null }],
    },
    order: [["createdAt", "ASC"]],
  });
  console.log(`Found ${pendingOrders.length} pending AMO orders.`);

  for (const order of pendingOrders) {
    try {
      await executeSingleAMOOrder(order);
    } catch (error) {
      console.error(`Failed to execute AMO order ${order.id}:`, error);
    }
  }
};
