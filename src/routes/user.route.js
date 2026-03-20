import express from "express";
import {
  getData,
  login,
  logout,
  refreshAccessToken,
  register,
} from "../controller/auth.controller.js";
import checkLoggedIn from "../middleware/auth.middleware.js";
// import rateLimit from "express-rate-limit";
import { uploader } from "../utils/multer.js";

const userRoute = express.Router();

// temporarily disabled rate limiter
// const limiter = rateLimit({
//   limit: 10,
//   windowMs: 1000 * 30,
//   message: "try after 30 sec!!",
// });

userRoute.route("/register").post(uploader.single("pfp"), register);
userRoute.route("/login").post(login);
userRoute.route("/get-user-data").get(checkLoggedIn, getData);
// userRoute.route("/data").get(checkLoggedIn, limiter, getData);
userRoute.route("/data").get(checkLoggedIn, getData);
userRoute.route("/refresh-token").get(refreshAccessToken);
userRoute.route("/logout").get(logout);

// userRoute.route("/upload").post(uploader.single("photo"), upload);

export default userRoute;
