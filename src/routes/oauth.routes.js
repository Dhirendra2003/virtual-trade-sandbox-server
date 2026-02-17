import express from "express";
import passport from "passport";
import checkLoggedIn from "../middleware/auth.middleware.js";
import { getAccessToken, getRefreshToken } from "../utils/generateTokens.js";
import { COOKIE_OPTIONS, ENV_VARIABLES } from "../utils/constants.js";

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
      res.cookie(
        "accesstoken",
        accessToken,
        COOKIE_OPTIONS.ACCESS_TOKEN_COOKIE_OPTIONS,
      );
      res.cookie(
        "refreshtoken",
        refreshToken,
        COOKIE_OPTIONS.REFRESH_TOKEN_COOKIE_OPTIONS,
      );

      // 4. Redirect to frontend
      // Assuming frontend is running on localhost:5173
      res.redirect(
        ENV_VARIABLES.FRONTEND_URL + "/authenticate/google" ||
          "http://localhost:5173/authenticate/google",
      );
    } catch (error) {
      console.log("Google login error:", error);
      res.redirect(
        `${ENV_VARIABLES.FRONTEND_URL || "http://localhost:5173"}/authenticate/google?error=google_failed`,
      );
    }
  },
);

////////////////////////////////////////////////////////////////////////////////

// Redirect to FB login
// this will be called by frontend and will open FB page -- done by passport
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email", "public_profile"] }),
);

// Callback route
// this will be called by FB and will redirect to frontend -- done by FB api
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
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
      res.cookie(
        "accesstoken",
        accessToken,
        COOKIE_OPTIONS.ACCESS_TOKEN_COOKIE_OPTIONS,
      );
      res.cookie(
        "refreshtoken",
        refreshToken,
        COOKIE_OPTIONS.REFRESH_TOKEN_COOKIE_OPTIONS,
      );

      // 4. Redirect to frontend
      // Assuming frontend is running on localhost:5173
      res.redirect(
        ENV_VARIABLES.FRONTEND_URL + "/authenticate/facebook" ||
          "http://localhost:5173/authenticate/facebook",
      );
    } catch (error) {
      console.log("Facebook login error:", error);
      res.redirect(
        `${ENV_VARIABLES.FRONTEND_URL || "http://localhost:5173"}/authenticate/facebook?error=facebook_failed`,
      );
    }
  },
);

router.get("/check", checkLoggedIn, (req, res) => {
  res.json({ message: "ok", user: req.user });
});

export default router;
