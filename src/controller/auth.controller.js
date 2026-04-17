import { ENV_VARIABLES } from "../utils/constants.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getAccessToken, getRefreshToken } from "../utils/generateTokens.js";
import cloudinary from "../utils/cloudinary.js";
import { DURATIONS } from "../utils/constants.js";
import createNotification from "../services/userNotification.service.js";

export const register = async (req, resp) => {
  let imgresult;
  if (req.file) {
    imgresult = await cloudinary.uploader.upload(req.file.path);
  }
  console.log("### result", imgresult);
  const { username, email, password, phone, dateofbirth } = req.body;
  if (!username || !email || !password || !dateofbirth) {
    return resp
      .status(401)
      .json({ message: "something is missing", success: false });
  }
  // console.log(username, email, password, phone, dateofbirth);
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
    profilePicURL: imgresult?.url || "",
  });
  const accessToken = getAccessToken(user.id, user.email);
  const refreshToken = getRefreshToken(user.id, user.email);

  user.refreshToken = refreshToken;
  await user.save();

  const userObject = user.toJSON();
  delete userObject.password;
  delete userObject.refreshToken;
  createNotification(
    user.id,
    "success",
    "Registration Successful",
    "Welcome to Virtual Trade Sandbox ! Start Exploring the Markets",
  );
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
    return resp.status(403).json({
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
    createNotification(
      user.id,
      "success",
      "New Login Detected",
      `Welcome back ${userObject.name}!`,
    );
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
      .status(403)
      .json({ message: "Invalid email or password", success: false });
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
        maxAge: DURATIONS.ACCESS_TOKEN_COOKIE_DURATION,
      })
      .cookie("refreshtoken", newRefreshToken, {
        httpOnly: true,
        secure: false, // Only send cookie over HTTPS
        sameSite: "lax", // Allows cross-origin requests
        maxAge: DURATIONS.REFRESH_TOKEN_COOKIE_DURATION,
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
      secure: false,
      sameSite: "lax",
      maxAge: 1 * 60 * 1000,
    })
    .cookie("refreshtoken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({ user: userObject, message: "login success", success: true });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req, resp) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return resp
        .status(400)
        .json({ message: "oldPassword and newPassword are required", success: false });
    }

    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return resp.status(404).json({ message: "user not found", success: false });
    }

    // OAuth users may not have a password
    if (!user.password) {
      return resp.status(403).json({
        message: "Password change is not available for social-login accounts.",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return resp
        .status(403)
        .json({ message: "Current password is incorrect", success: false });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    createNotification(
      user.id,
      "warning",
      "Password Changed",
      "Your account password was updated successfully. If this wasn't you, please contact support immediately."
    );

    return resp
      .status(200)
      .json({ message: "Password updated successfully", success: true });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({ message: "Internal server error", success: false });
  }
};

// ─── Update Profile Picture ───────────────────────────────────────────────────
export const updateProfilePicture = async (req, resp) => {
  try {
    if (!req.file) {
      return resp.status(400).json({ message: "No image file provided", success: false });
    }

    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return resp.status(404).json({ message: "user not found", success: false });
    }

    // Upload to Cloudinary
    const imgResult = await cloudinary.uploader.upload(req.file.path);
    user.profilePicURL = imgResult.url;
    await user.save();

    const userObject = user.toJSON();
    delete userObject.password;
    delete userObject.refreshToken;

    createNotification(
      user.id,
      "success",
      "Profile Picture Updated",
      "Your profile photo has been changed successfully."
    );

    return resp.status(200).json({
      user: userObject,
      message: "Profile picture updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({ message: "Internal server error", success: false });
  }
};

// ─── Update Display Name ──────────────────────────────────────────────────────
export const updateDisplayName = async (req, resp) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return resp
        .status(400)
        .json({ message: "Name must be at least 2 characters", success: false });
    }

    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return resp.status(404).json({ message: "user not found", success: false });
    }

    user.name = name.trim();
    await user.save();

    const userObject = user.toJSON();
    delete userObject.password;
    delete userObject.refreshToken;

    createNotification(
      user.id,
      "info",
      "Display Name Updated",
      `Your display name has been changed to "${userObject.name}".`
    );

    return resp.status(200).json({
      user: userObject,
      message: "Display name updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({ message: "Internal server error", success: false });
  }
};

// ─── Update User Preferences ──────────────────────────────────────────────────
export const updatePreferences = async (req, resp) => {
  try {
    const { preferences } = req.body;
    if (!preferences) {
      return resp.status(400).json({ message: "Preferences are required", success: false });
    }

    const user = await User.findOne({ where: { id: req.user.id } });
    if (!user) {
      return resp.status(404).json({ message: "user not found", success: false });
    }

    // Merge or overwrite preferences
    user.preferences = preferences;
    await user.save();

    const userObject = user.toJSON();
    delete userObject.password;
    delete userObject.refreshToken;

    return resp.status(200).json({
      user: userObject,
      message: "Preferences updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return resp.status(500).json({ message: "Internal server error", success: false });
  }
};
