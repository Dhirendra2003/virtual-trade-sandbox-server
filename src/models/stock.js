import { DataTypes } from "sequelize";
import dbManager from "../config/DatabaseManager.js";

const sequelize = dbManager.getInstance();

const Stock = sequelize.define(
  "Stock",
  {
    instrument_key: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    segment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    exchange: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    instrument_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trading_symbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    short_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "stocks",
    timestamps: true,
  },
);

export default Stock;
