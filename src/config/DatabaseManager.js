import { Sequelize } from "sequelize";
import config from "./sequelize.cjs";
import { ENV_VARIABLES } from "../utils/constants.js";
import logger from "../utils/errorLogger.js";

class DatabaseManager {
  constructor() {
    this.sequelize = null;
  }

  initialize() {
    if (this.sequelize) return;
    const env = ENV_VARIABLES.NODE_ENV || "development";
    const dbConfig = config[env];
    this.sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        dialect: dbConfig.dialect,
        logging: false,
      },
    );
  }

  async connect() {
    if (!this.sequelize) {
      this.initialize();
    }
    try {
      await this.sequelize.authenticate();
      logger.info("Connection has been established successfully.");

      // Sync database tables based on models
      const env = ENV_VARIABLES.NODE_ENV || "development";
      const syncing = ENV_VARIABLES.SYNC_TABLES === "true";

      if (env === "development" && syncing) {
        // In development: alter tables to match models (safe, doesn't drop data)
        await this.sequelize.sync({ alter: syncing });
        logger.info("Database synced successfully (alter mode).");
        console.log("Database synced successfully (alter mode).");
      } else if (env === "production") {
        // In production: NEVER use sync - use migrations instead
        logger.info("Production mode: Skipping sync. Use migrations.");
      }

      return this.sequelize;
    } catch (error) {
      logger.error("Unable to connect to the database:", error);
      console.error("Unable to connect to the database:", error);
      throw error;
    }
  }

  getInstance() {
    if (!this.sequelize) {
      this.initialize();
    }
    return this.sequelize;
  }
}

const dbManager = new DatabaseManager();
export default dbManager;
