import { getMarketStatusAPI } from "../services/upstox.service.js";
import {
  executeAMOorders,
  settleIntradayTrades,
} from "./jobs/stockCronjobs.js";

const startCronJobs = async (cronType) => {
  try {
    console.log("Starting cron jobs...", cronType);
    const marketStatus = await getMarketStatusAPI();
    const isMarketOpen = marketStatus?.data?.status === "NORMAL_OPEN";

    if (cronType === "settleIntradayTrades") {
      await settleIntradayTrades();
    }
    if (!isMarketOpen) {
      console.log("Skipping AMO execution because market is closed");
      return;
    }

    if (cronType === "executeAMO") {
      await executeAMOorders();
    }
  } catch (error) {
    console.error("Error executing cron jobs:", error);
  }
};
export default startCronJobs;
