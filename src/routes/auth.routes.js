import express from "express";
import {
  forgotPassword,
  resetPasswordWithToken,
  verifyEmail,
  resendVerificationEmail,
} from "../controller/auth.controller.js";

const authRoute = express.Router();

authRoute.route("/forgot-password").post(forgotPassword);
authRoute.route("/reset-password").post(resetPasswordWithToken);
authRoute.route("/verify-email").post(verifyEmail);
authRoute.route("/resend-verification").post(resendVerificationEmail);

export default authRoute;
