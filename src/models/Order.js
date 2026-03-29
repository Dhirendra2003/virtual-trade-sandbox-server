import { DataTypes } from "sequelize";
import dbManager from "../config/DatabaseManager.js";

const sequelize = dbManager.getInstance();

const OrderHistory = sequelize.define(
  "OrderHistory",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // the table name for User model
        key: "id",
      },
    },
    instrument_key: {
      type: DataTypes.STRING,
      references: {
        model: "stocks", // the table name for Stock model
        key: "instrument_key",
      },
      allowNull: false,
    },
    trade_type: {
      type: DataTypes.ENUM("buy", "sell"),
      allowNull: false,
    },
    trade_duration: {
      //if intraday then trade will be setteled by cron at 3.30 pm
      type: DataTypes.ENUM("intraday", "delivery"),
      allowNull: false,
    },
    is_after_market_order: {
      //will be executed by cron job at 9:15 AM
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("executed", "pending", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    order_type: {
      //all will be market for now , as yet to plan backend live socket for limit orders
      type: DataTypes.ENUM("market", "limit"),
      allowNull: false,
      defaultValue: "market",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "order_history",
    timestamps: true,
  },
);

export default OrderHistory;
//orders will act as a log of all orders placed by the user
