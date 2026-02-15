import express from "express";
import passport from "passport";
import checkLoggedIn from "../middleware/auth.middleware.js";
import { getAccessToken, getRefreshToken } from "../utils/generateTokens.js";

const router = express.Router();

// Redirect to Google login
// this will be called by frontend and will open google page -- done by passport
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Callback route
// this will be called by google and will redirect to frontend -- done by google api
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/authenticate/login",
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // 1. Generate tokens
      const accessToken = getAccessToken(user.id, user.email);
      const refreshToken = getRefreshToken(user.id, user.email);

      // 2. Save refresh token to user in DB
      user.refreshToken = refreshToken;
      await user.save();

      // 3. Set cookies (using same options as your login controller)
      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("accesstoken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 1 * 60 * 1000, // 1 minute
      });

      res.cookie("refreshtoken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 4. Redirect to frontend
      // Assuming frontend is running on localhost:5173
      res.redirect(
        process.env.FRONTEND_URL + "/authenticate/google" ||
          "http://localhost:5173/authenticate/google",
      );
    } catch (error) {
      console.log("Google login error:", error);
      res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/authenticate/google?error=google_failed`,
      );
    }
  },
);

router.get("/check", checkLoggedIn, (req, res) => {
  res.json({ message: "ok", user: req.user });
});

export default router;
