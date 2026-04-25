import {
  getUserNotifications,
  getAllUserNotifications,
  markAllAsRead,
} from "../controller/notification.controller.js";
import express from "express";
import checkLoggedIn from "../middleware/auth.middleware.js";

const notificationRoute = express.Router();

//auth required
notificationRoute
  .route("/get-user-notifications")
  .get(checkLoggedIn, getUserNotifications);
notificationRoute
  .route("/get-all-user-notifications")
  .get(checkLoggedIn, getAllUserNotifications);
notificationRoute
  .route("/mark-all-notifications-as-read")
  .post(checkLoggedIn, markAllAsRead);

export default notificationRoute;
