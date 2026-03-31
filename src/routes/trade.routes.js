import {
  registerTrade,
  getTrades,
  getUserFunds,
  getUserTradeHistory,
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

export default tradeRoute;
