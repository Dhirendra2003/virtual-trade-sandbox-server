import {
  getMarketStatus,
  getStockChartData,
  getStockNews,
  saveStocksData,
  searchStocks,
} from "../controller/stocks.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";

const stocksRoute = express.Router();

//auth required
stocksRoute.route("/search-stocks").get(checkLoggedIn, searchStocks);
stocksRoute.route("/get-stock-chart-data").get(getStockChartData);
stocksRoute.route("/get-stock-news").get(checkLoggedIn, getStockNews);

//authless
stocksRoute.route("/get-market-status").get(getMarketStatus);

//repopulate DB
stocksRoute.route("/save-stocks-data").put(saveStocksData);
export default stocksRoute;
