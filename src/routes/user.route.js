import express from "express";
import {
  getData,
  login,
  logout,
  refreshAccessToken,
  register,
  // upload,
} from "../controller/auth.controller.js";
import checkLoggedIn from "../middleware/auth.middleware.js";
// import rateLimit from "express-rate-limit";
// import multer from "multer";
const userRoute = express.Router();

// temporarily disabled rate limiter
// const limiter = rateLimit({
//   limit: 10,
//   windowMs: 1000 * 30,
//   message: "try after 30 sec!!",
// });

// temporarily disabled multer
// const storage = multer.diskStorage({
//   destination: function (req, file, callback) {
//     callback(null, "./uploads/");
//   },
//   filename: function (req, file, callback) {
//     return callback(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const uploader=multer({ dest:'./uploads/'})
// const uploader = multer({ storage: storage });
userRoute.route("/register").post(register);
userRoute.route("/login").post(login);
userRoute.route("/get-user-data").get(checkLoggedIn, getData);
// userRoute.route("/data").get(checkLoggedIn, limiter, getData);
userRoute.route("/data").get(checkLoggedIn, getData);
userRoute.route("/refresh-token").get(refreshAccessToken);
userRoute.route("/logout").get(logout);

// userRoute.route("/upload").post(uploader.single("photo"), upload);

export default userRoute;
