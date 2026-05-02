import { getMarketStatusAPI } from "../services/upstox.service.js";
import logger from "../utils/errorLogger.js";
import {
  executeAMOorders,
  settleIntradayTrades,
} from "./jobs/stockCronjobs.js";
import { sendWeeklyReports } from "./jobs/weeklyReportCronjob.js";

const startCronJobs = async (cronType) => {
  try {
    // console.log("Starting cron jobs...", cronType);

    // Weekly report does not depend on market status — run independently
    if (cronType === "sendWeeklyReports") {
      await sendWeeklyReports();
      return;
    }

    const marketStatus = await getMarketStatusAPI();
    const isMarketOpen = marketStatus?.data?.status === "NORMAL_OPEN";

    if (cronType === "settleIntradayTrades") {
      await settleIntradayTrades();
    }
    if (!isMarketOpen) {
      logger.info("Skipping AMO execution because market is closed");
      return;
    }

    if (cronType === "executeAMO") {
      await executeAMOorders();
    }
  } catch (error) {
    logger.error("Error executing cron jobs:", error);
  }
};
export default startCronJobs;
