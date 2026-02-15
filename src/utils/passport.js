import "dotenv/config";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import User from "../models/User.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/api/v1/oauth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ where: { googleId: profile.id } });
        if (!user) {
          user = await User.findOne({
            where: { email: profile.emails[0].value },
          });
          if (user) {
            user.googleId = profile.id; // link google id to existing user in case of email already exists in db
            await user.save();
          } else {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
            });
            console.log("USER CREATED SUCCESSFULLY", user);
          }
        }
        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    },
  ),
);
