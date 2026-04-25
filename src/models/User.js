import { DataTypes } from "sequelize";
import dbManager from "../config/DatabaseManager.js";

const sequelize = dbManager.getInstance();

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
      // defaultValue: DataTypes.DATE,
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    profilePicURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userRole: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    funds: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1000000,
    },
    actualFunds: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1000000,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        notifications: {
          tradeExecuted: true,
          amoExecuted: true,
          appUpdates: true,
        },
        mailsPreference: {
          monthlySummary: true,
          newUpdates: true,
        },
        theme: "dark",
        chartType: "candlestick",
        chartInterval: "1m",
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
  },
);

export default User;
