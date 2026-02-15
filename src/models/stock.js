import { DataTypes, Model } from "sequelize";
import dbManager from "../config/DatabaseManager.js";

const sequelize = dbManager.getInstance();

class Stock extends Model {
  static associate(models) {
    // define association here
  }
}

Stock.init(
  {
    price: DataTypes.STRING,
    Buyprice: DataTypes.STRING,
    stockName: DataTypes.STRING,
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
    sequelize,
    modelName: "Stock",
    tableName: "stocks", // Explicitly define table name
    timestamps: true,
  },
);

export default Stock;
