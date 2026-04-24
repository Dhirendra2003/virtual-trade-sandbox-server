import "dotenv/config";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import passport from "passport";
import User from "../models/User.js";
import { sendEmail } from "../services/mailService.js";
import welcomMail from "../mailTemplates/welcome-mail.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/oauth/google/callback`,
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
            console.log("USER CREATED");
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              profilePicURL: profile.photos[0].value,
            });

            // Send Welcome Email
            try {
              const htmlContent = welcomMail(user.name);
              sendEmail(
                user.email,
                "Welcome to Virtual Trade Sandbox! 🚀",
                `Hi ${user.name}, welcome aboard! We're excited to have you here.`,
                htmlContent,
              ).catch((err) => console.error("Error sending welcome email:", err));
            } catch (error) {
              console.error("Error sending welcome email:", error);
            }
            // console.log("PROFILE", profile);
            // console.log("USER CREATED SUCCESSFULLY", user);
          }
        } else {
          //still update user pfp
          user.profilePicURL = profile.photos[0].value;
          await user.save();
        }
        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    },
  ),
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      profileFields: ["id", "displayName", "photos", "email"],
      callbackURL: `${process.env.BACKEND_URL}/api/v1/oauth/facebook/callback`,
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        let user = await User.findOne({ where: { facebookId: profile.id } });
        if (!user) {
          user = await User.findOne({
            where: { email: profile.emails[0].value },
          });
          if (user) {
            user.facebookId = profile.id; // link fb id to existing user in case of email already exists in db
            await user.save();
          } else {
            console.log(profile);
            user = await User.create({
              facebookId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              profilePicURL: profile.photos[0].value,
            });

            // Send Welcome Email
            try {
              const htmlContent = welcomMail(user.name);
              sendEmail(
                user.email,
                "Welcome to Virtual Trade Sandbox! 🚀",
                `Hi ${user.name}, welcome aboard! We're excited to have you here.`,
                htmlContent,
              ).catch((err) => console.error("Error sending welcome email:", err));
            } catch (error) {
              console.error("Error sending welcome email:", error);
            }
            console.log("USER CREATED SUCCESSFULLY", user);
          }
        } else {
          //still update user pfp
          user.profilePicURL = profile.photos[0].value;
          await user.save();
        }
        return cb(null, user);
      } catch (error) {
        return cb(error, null);
      }
    },
  ),
);
