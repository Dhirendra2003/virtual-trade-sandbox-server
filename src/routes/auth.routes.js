import express from "express";
import {
  forgotPassword,
  resetPasswordWithToken,
} from "../controller/auth.controller.js";

const authRoute = express.Router();

authRoute.route("/forgot-password").post(forgotPassword);
authRoute.route("/reset-password").post(resetPasswordWithToken);

export default authRoute;
