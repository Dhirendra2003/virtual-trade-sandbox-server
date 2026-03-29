import { DataTypes } from "sequelize";
import dbManager from "../config/DatabaseManager.js";

const sequelize = dbManager.getInstance();

const Watchlist = sequelize.define(
  "Watchlist",
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
    },
  },
  {
    tableName: "watchlist",
    timestamps: true,
  },
);

export default Watchlist;
