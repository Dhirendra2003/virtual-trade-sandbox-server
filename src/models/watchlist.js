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
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    instrument_key: {
      type: DataTypes.STRING,
      references: {
        model: "stocks", // the table name for Stock model
        key: "instrument_key",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "watchlist",
    timestamps: true,
  },
);

export default Watchlist;
