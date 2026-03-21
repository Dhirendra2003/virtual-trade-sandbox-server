import {
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../controller/watchlist.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";

const watchlistRoute = express.Router();

//auth required
watchlistRoute
  .route("/get-user-watchlist")
  .get(checkLoggedIn, getUserWatchlist);
watchlistRoute.route("/add-to-watchlist").post(checkLoggedIn, addToWatchlist);
watchlistRoute
  .route("/remove-from-watchlist")
  .post(checkLoggedIn, removeFromWatchlist);

export default watchlistRoute;
