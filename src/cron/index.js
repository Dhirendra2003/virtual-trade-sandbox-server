import { getMarketStatusAPI } from "../services/upstox.service.js";
import { executeAMOorders } from "./jobs/stockCronjobs.js";

const startCronJobs = async () => {
  try {
    console.log("Starting cron jobs...");
    const marketStatus = await getMarketStatusAPI();
    const isMarketOpen = marketStatus?.data?.status === "NORMAL_OPEN";

    if (!isMarketOpen) {
      console.log("Skipping AMO execution because market is closed");
      return;
    }

    await executeAMOorders();
  } catch (error) {
    console.error("Error executing cron jobs:", error);
  }
};
export default startCronJobs;
