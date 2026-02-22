import "dotenv/config";
const isProduction = process.env.NODE_ENV === "production";

export const DURATIONS = {
  ACCESS_TOKEN_DURATION: "30m",
  REFRESH_TOKEN_DURATION: "7d",
  ACCESS_TOKEN_COOKIE_DURATION: 30 * 60 * 1000, // 30 minutes
  REFRESH_TOKEN_COOKIE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const COOKIE_OPTIONS = {
  ACCESS_TOKEN_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: DURATIONS.ACCESS_TOKEN_COOKIE_DURATION,
  },

  REFRESH_TOKEN_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: DURATIONS.REFRESH_TOKEN_COOKIE_DURATION,
  },
};

export const ENV_VARIABLES = {
  //basic
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL,
  NODE_ENV: process.env.NODE_ENV,
  //db credentials
  PG_HOST: process.env.PG_HOST,
  PG_DATABASE: process.env.PG_DATABASE,
  PG_PORT: process.env.PG_PORT,
  PG_USER: process.env.PG_USER,
  PG_PASSWORD: process.env.PG_PASSWORD,
  SYNC_TABLES: process.env.SYNC_TABLES,
  //tokens secrets
  REF_JWT_SECRET: process.env.REF_JWT_SECRET,
  ACC_JWT_SECRET: process.env.ACC_JWT_SECRET,
  //auth ids,secrets
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
};
