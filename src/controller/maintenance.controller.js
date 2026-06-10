import dbManager from "../config/DatabaseManager.js";
import logger from "../utils/errorLogger.js";

export const performMaintenanceDbActivity = async () => {
  const sequelize = dbManager.getInstance();
  await dbManager.connect();
  await sequelize.query("SELECT 1");
};
