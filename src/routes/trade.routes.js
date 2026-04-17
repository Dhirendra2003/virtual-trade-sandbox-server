import {
  registerTrade,
  getTrades,
  getUserFunds,
  getUserTradeHistory,
  cancelAMOorder,
  settleTrade,
  getPortfolioStats,
  downloadUserTradeHistory,
  getUserAnalytics,
  downloadUserAnalyticsReport,
} from "../controller/trade.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";
import marketStatus from "../middleware/marketStatus.middleware.js";

const tradeRoute = express.Router();

//auth required
tradeRoute
  .route("/register-trade")
  .post(checkLoggedIn, marketStatus, registerTrade);
tradeRoute.route("/get-trades-and-orders").get(checkLoggedIn, getTrades);
tradeRoute.route("/get-user-funds").get(checkLoggedIn, getUserFunds);
tradeRoute
  .route("/get-user-trade-history")
  .get(checkLoggedIn, getUserTradeHistory);
tradeRoute.route("/cancel-amo-order").put(checkLoggedIn, cancelAMOorder);
tradeRoute.route("/settle-trade").put(checkLoggedIn, marketStatus, settleTrade);
tradeRoute.route("/portfolio-stats").get(checkLoggedIn, getPortfolioStats);
tradeRoute
  .route("/download-trade-history")
  .get(checkLoggedIn, downloadUserTradeHistory);
tradeRoute.route("/user-analytics").get(checkLoggedIn, getUserAnalytics);
tradeRoute
  .route("/download-analytics")
  .get(checkLoggedIn, downloadUserAnalyticsReport);

export default tradeRoute;
