import express from "express";
import {
  getData,
  login,
  logout,
  refreshAccessToken,
  register,
  resetPassword,
  updateProfilePicture,
  updateDisplayName,
  updatePreferences,
  getUserStartingFunds,
} from "../controller/auth.controller.js";
import checkLoggedIn from "../middleware/auth.middleware.js";
import { uploader } from "../utils/multer.js";

const userRoute = express.Router();

userRoute.route("/register").post(uploader.single("pfp"), register);
userRoute.route("/login").post(login);
userRoute.route("/get-user-data").get(checkLoggedIn, getData);
userRoute.route("/data").get(checkLoggedIn, getData);
userRoute.route("/refresh-token").get(refreshAccessToken);
userRoute.route("/logout").get(logout);

// ─── Protected profile routes ────────────────────────────────────────────────
userRoute.route("/reset-password").patch(checkLoggedIn, resetPassword);
userRoute
  .route("/update-profile-picture")
  .patch(checkLoggedIn, uploader.single("pfp"), updateProfilePicture);
userRoute.route("/update-display-name").patch(checkLoggedIn, updateDisplayName);
userRoute.route("/update-preferences").patch(checkLoggedIn, updatePreferences);
userRoute
  .route("/get-user-starting-funds")
  .get(checkLoggedIn, getUserStartingFunds);

export default userRoute;
