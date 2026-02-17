import { ENV_VARIABLES } from "../utils/constants.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getAccessToken, getRefreshToken } from "../utils/generateTokens.js";

export const register = async (req, resp) => {
  const { username, email, password, phone, dateofbirth } = req.body;
  if (!username || !email || !password || !dateofbirth) {
    return resp
      .status(401)
      .json({ message: "something is missing", success: false });
  }
  console.log(username, email, password, phone, dateofbirth);
  const userExist = await User.findOne({ where: { email: email } });
  if (userExist) {
    return resp
      .status(400)
      .json({ message: "user already exist", success: false });
  }
  //hash the password before storing in db
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: username,
    email: email,
    password: hashedPassword,
    phone: phone,
    dateOfBirth: dateofbirth,
  });
  const accessToken = getAccessToken(user.id, user.email);
  const refreshToken = getRefreshToken(user.id, user.email);

  user.refreshToken = refreshToken;
  await user.save();

  const userObject = user.toJSON();
  delete userObject.password;
  delete userObject.refreshToken;
  return resp
    .status(200)
    .cookie("accesstoken", accessToken, {
      httpOnly: true,
      secure: false, // Only send cookie over HTTPS
      sameSite: "lax", // Allows cross-origin requests
      maxAge: 1 * 60 * 1000,
    })
    .cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      secure: false, // Only send cookie over HTTPS
      sameSite: "lax", // Allows cross-origin requests
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ user: userObject, message: "user registered", success: true });
};

export const login = async (req, resp) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return resp
      .status(401)
      .json({ message: "something is missing", success: false });
  }
  console.log(email, password);
  const user = await User.findOne({ where: { email: email } });
  if (!user) {
    return resp.status(404).json({ message: "user not found", success: false });
  }

  // Check if user has a password (might be null for OAuth users)
  if (!user.password && (user.facebookId || user.googleId)) {
    return resp.status(400).json({
      message:
        "This account was created using social login. Please login with Google or Facebook.",
      success: false,
    });
  }

  if (bcrypt.compareSync(password, user.password)) {
    const accessToken = getAccessToken(user.id, user.email);
    const refreshToken = getRefreshToken(user.id, user.email);

    user.refreshToken = refreshToken;
    await user.save();

    const userObject = user.toJSON();
    delete userObject.password;
    delete userObject.refreshToken;

    return resp
      .status(200)
      .cookie("accesstoken", accessToken, {
        httpOnly: true,
        secure: false, // Only send cookie over HTTPS
        sameSite: "lax", // Allows cross-origin requests
        maxAge: 1 * 60 * 1000,
      })
      .cookie("refreshtoken", refreshToken, {
        httpOnly: true,
        secure: false, // Only send cookie over HTTPS
        sameSite: "lax", // Allows cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ user: userObject, message: "login success", success: true });
  } else {
    return resp
      .status(401)
      .json({ message: "password do not match", success: false });
  }
};

export const logout = async (req, resp) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    //delete from db
    await User.findOneAndUpdate(
      { refreshToken: refreshToken },
      { refreshToken: "" },
    );
  }
  return resp
    .status(200)
    .clearCookie("accesstoken")
    .clearCookie("refreshtoken")
    .json({ message: "logged out", success: true });
};

export const refreshAccessToken = async (req, resp) => {
  try {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) {
      return resp
        .status(401)
        .json({ message: "refresh token missing", success: false });
    }
    //if token exists
    const decoded = jwt.verify(refreshToken, ENV_VARIABLES.REF_JWT_SECRET);
    const user = await User.findOne({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return resp
        .status(403)
        .json({ message: "forbidden access", success: false });
    }
    // generate new access token
    const newRefreshToken = getRefreshToken(user.id, user.email);
    const newAccessToken = getAccessToken(user.id, user.email);
    user.refreshToken = newRefreshToken;
    await user.save();

    return resp
      .status(200)
      .cookie("accesstoken", newAccessToken, {
        httpOnly: true,
        secure: false, // Only send cookie over HTTPS
        sameSite: "lax", // Allows cross-origin requests
        maxAge: 1 * 60 * 1000,
      })
      .cookie("refreshtoken", newRefreshToken, {
        httpOnly: true,
        secure: false, // Only send cookie over HTTPS
        sameSite: "lax", // Allows cross-origin requests
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "Access token refreshed", success: true });
  } catch (error) {
    console.log(error);
    return resp
      .status(403)
      .json({ message: "invalid / expired refresh token", success: false });
  }
};

export const getData = async (req, resp) => {
  const user = await User.findOne({ where: { id: req.user.id } });
  if (!user) {
    return resp.status(404).json({ message: "user not found", success: false });
  }

  const accessToken = getAccessToken(user.id, user.email);
  const refreshToken = getRefreshToken(user.id, user.email);

  user.refreshToken = refreshToken;
  await user.save();

  const userObject = user.toJSON(); //mongoose document to plain js object
  delete userObject.password;
  delete userObject.refreshToken;

  return resp
    .status(200)
    .cookie("accesstoken", accessToken, {
      httpOnly: true,
      secure: false, // Only send cookie over HTTPS
      sameSite: "lax", // Allows cross-origin requests
      maxAge: 1 * 60 * 1000,
    })
    .cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      secure: false, // Only send cookie over HTTPS
      sameSite: "lax", // Allows cross-origin requests
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ user: userObject, message: "login success", success: true });
};

export const upload = async (req, resp) => {
  console.log(req.body);
  console.log(req.file);

  return resp.redirect("/index.html");
};
