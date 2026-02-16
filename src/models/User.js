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
    profilePicURL: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userRole: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
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
    tableName: "users",
    timestamps: true,
  },
);

export default User;
