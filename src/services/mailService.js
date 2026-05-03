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
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    // Construct the email string in standard MIME format
    const subjectBase64 = Buffer.from(subject).toString("base64");
    const messageParts = [
      `From: "Virtual Trade Sandbox" <${process.env.EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${subjectBase64}?=`,
      "MIME-Version: 1.0",
    ];

    if (html) {
      messageParts.push("Content-Type: text/html; charset=utf-8");
      messageParts.push("");
      messageParts.push(html);
    } else {
      messageParts.push("Content-Type: text/plain; charset=utf-8");
      messageParts.push("");
      messageParts.push(text);
    }

    const message = messageParts.join("\r\n");
    
    // Encode in base64url format
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email via HTTP
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    logger.info("Message sent via Gmail HTTP API: %s", res.data.id);
    console.log("Email sent successfully");
    return res.data;
  } catch (error) {
    console.log("Error in sending email : ", error);
    logger.error("Error sending email:", error);
    throw error;
  }
};
