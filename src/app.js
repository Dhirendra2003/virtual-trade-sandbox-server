import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import userRoute from "./routes/user.route.js";
import oauthRoute from "./routes/oauth.routes.js";
import "./utils/passport.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
import CustomError from "./utils/errorClass.js";
import { ENV_VARIABLES } from "./utils/constants.js";

const app = express();
const frontendURL = ENV_VARIABLES.FRONTEND_URL;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: frontendURL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

//Routes
app.use("/api/v1/oauth/", oauthRoute);
app.use("/api/v1/user/", userRoute);

app.get("/", (req, res) => {
  res.json("Hello, World!");
});

// for all unkown routes
app.all(/.*/, (req, res) => {
  console.log(req.originalUrl);
  const error = new CustomError(
    `(${req.method}) ${req.originalUrl} Route not found`,
    404,
  );
  throw error;
});

//for all error handling
app.use(errorHandler);

export default app;
