import { registerTrade, getTrades } from "../controller/trade.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";
import marketStatus from "../middleware/marketStatus.middleware.js";

const tradeRoute = express.Router();

//auth required
tradeRoute
  .route("/register-trade")
  .post(checkLoggedIn, marketStatus, registerTrade);
tradeRoute.route("/get-trades").get(checkLoggedIn, getTrades);

export default tradeRoute;
