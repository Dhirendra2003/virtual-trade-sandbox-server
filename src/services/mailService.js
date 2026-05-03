import nodemailer from "nodemailer";
import logger from "../utils/errorLogger.js";
import { google } from "googleapis";

const clientID = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUriOauthPlayground = process.env.GOOGLE_REDIRECT_URI || "";
const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN || "";

const transporter_OLD = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps with some hosting provider restrictions
  },
});

export const sendEmail_OLD = async (to, subject, text, html) => {
  try {
    const info = await transporter_OLD.sendMail({
      from: `"Virtual Trade Sandbox" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};

//new approach - GMAIL API -- as render blocks SMTP ports

const oAuth2Client = new google.auth.OAuth2(
  clientID,
  clientSecret,
  redirectUriOauthPlayground,
);
oAuth2Client.setCredentials({ refresh_token: refreshToken });

export const sendEmail = async (to, subject, text, html) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: clientID,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
        accessToken: accessToken,
      },
      tls: {
        rejectUnauthorized: false, // Helps with some hosting provider restrictions
      },
    });

    const info = await transporter.sendMail({
      from: `"Virtual Trade Sandbox" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    logger.info("Message sent: %s", info.messageId);
    console.log("Email sent successfully");
    return info;
  } catch (error) {
    console.log("Error in sending email : ", error);
    logger.error("Error sending email:", error);
    throw error;
  }
};
