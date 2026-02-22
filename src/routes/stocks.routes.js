import {
  getStockChartData,
  saveStocksData,
  searchStocks,
} from "../controller/stocks.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";

const stocksRoute = express.Router();
stocksRoute.route("/save-stocks-data").put(saveStocksData);
stocksRoute.route("/search-stocks").get(checkLoggedIn, searchStocks);
stocksRoute.route("/get-stock-chart-data").get(getStockChartData);

export default stocksRoute;
