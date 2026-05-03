import { COOKIE_OPTIONS, ENV_VARIABLES } from "../utils/constants.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { getAccessToken, getRefreshToken } from "../utils/generateTokens.js";
import cloudinary from "../utils/cloudinary.js";
import { DURATIONS } from "../utils/constants.js";
import createNotification from "../services/userNotification.service.js";
import { sendEmail } from "../services/mailService.js";
import welcomMail from "../mailTemplates/welcome-mail.js";
import resetPasswordMail from "../mailTemplates/reset-password-mail.js";
import verifyEmailMail from "../mailTemplates/verify-email-mail.js";
import logger from "../utils/errorLogger.js";

export const register = async (req, resp) => {
  let imgresult;
  if (req.file) {
    imgresult = await cloudinary.uploader.upload(req.file.path);
  }

  const { username, email, password, phone, dateofbirth } = req.body;
  if (!username || !email || !password || !dateofbirth) {
    return resp
      .status(401)
      .json({ message: "something is missing", success: false });
  }

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

  // Generate verification JWT (Option C: type claim prevents cross-use with reset-password tokens)
  const verificationToken = jwt.sign(
    { userId: user.id, email: user.email, type: "email-verification" },
    ENV_VARIABLES.RESET_PASSWORD_JWT_SECRET,
    { expiresIn: "24h" },
  );
  user.verificationToken = verificationToken;
  await user.save();

  // Send Verification Email
  try {
    const verifyLink = `${ENV_VARIABLES.FRONTEND_URL}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const htmlContent = verifyEmailMail(user.name, verifyLink);
    sendEmail(
      user.email,
      "Verify your Virtual Trade Sandbox email",
      `Please verify your email using this link: ${verifyLink}`,
      htmlContent,
    ).catch((err) => logger.error("Error sending verification email:", err));
  } catch (error) {
    logger.error("Error sending verification email:", error);
  }

  return resp.status(200).json({
    message: "Registration successful. Please verify your email.",
    success: true,
  });
};

export const login = async (req, resp) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return resp
      .status(401)
      .json({ message: "something is missing", success: false });
  }
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

  // Block login for unverified email accounts
  if (!user.isVerified) {
    return resp.status(403).json({
      message:
        "Please verify your email before logging in. A verification mail has been sent to your email address.",
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
      "info",
      "New Login Detected",
      `Welcome back ${userObject.name}!`,
    );
    return resp
      .status(200)
      .cookie(
        "accesstoken",
        accessToken,
        COOKIE_OPTIONS.ACCESS_TOKEN_COOKIE_OPTIONS,
      )
      .cookie(
        "refreshtoken",
        refreshToken,
        COOKIE_OPTIONS.REFRESH_TOKEN_COOKIE_OPTIONS,
      )
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
    .cookie(
      "accesstoken",
      newAccessToken,
      COOKIE_OPTIONS.ACCESS_TOKEN_COOKIE_OPTIONS,
    )
    .cookie(
      "refreshtoken",
      newRefreshToken,
      COOKIE_OPTIONS.REFRESH_TOKEN_COOKIE_OPTIONS,
    )
    .json({ message: "Access token refreshed", success: true });
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

// ─── Verify Email ────────────────────────────────────────────────────────────
export const verifyEmail = async (req, resp) => {
  const { token } = req.body;

  if (!token) {
    return resp
      .status(400)
      .json({ message: "Token is required", success: false });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, ENV_VARIABLES.RESET_PASSWORD_JWT_SECRET);
  } catch (error) {
    return resp.status(400).json({
      message: "Verification link is invalid or has expired",
      success: false,
    });
  }

  if (decoded.type !== "email-verification") {
    return resp
      .status(400)
      .json({ message: "Invalid token type", success: false });
  }

  const user = await User.findOne({
    where: { id: decoded.userId, verificationToken: token },
  });

  if (!user) {
    return resp.status(400).json({
      message: "Verification link is invalid or already used",
      success: false,
    });
  }

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  // Send Welcome Email upon successful verification
  try {
    const htmlContent = welcomMail(user.name);
    sendEmail(
      user.email,
      "Welcome to Virtual Trade Sandbox! 🚀",
      `Hi ${user.name}, welcome aboard! We're excited to have you here.`,
      htmlContent,
    ).catch((err) => logger.error("Error sending welcome email:", err));
  } catch (error) {
    logger.error("Error sending welcome email:", error);
  }

  return resp
    .status(200)
    .json({ message: "Email verified successfully", success: true });
};

export const resendVerificationEmail = async (req, resp) => {
  const { token, email } = req.body; // accepts expired token OR email
  let user;

  if (token) {
    // decode without verifying (expired tokens are rejected by jwt.verify, so we decode manually)
    try {
      const decoded = jwt.decode(token);
      if (decoded?.userId) {
        user = await User.findOne({ where: { id: decoded.userId } });
      }
    } catch (_) {
      /* ignore */
    }
  } else if (email) {
    user = await User.findOne({ where: { email } });
  }

  if (!user) {
    return resp.status(404).json({ message: "User not found", success: false });
  }

  if (user.isVerified) {
    return resp
      .status(400)
      .json({ message: "Email is already verified", success: false });
  }

  const newToken = jwt.sign(
    { userId: user.id, email: user.email, type: "email-verification" },
    ENV_VARIABLES.RESET_PASSWORD_JWT_SECRET,
    { expiresIn: "24h" },
  );
  user.verificationToken = newToken;
  await user.save();

  const verifyLink = `${ENV_VARIABLES.FRONTEND_URL}/verify-email?token=${encodeURIComponent(newToken)}`;
  const htmlContent = verifyEmailMail(user.name, verifyLink);

  sendEmail(
    user.email,
    "Verify your Virtual Trade Sandbox email",
    `Please verify your email using this link: ${verifyLink}`,
    htmlContent,
  ).catch((err) => logger.error("Error sending verification email:", err));

  return resp
    .status(200)
    .json({ message: "Verification email resent successfully", success: true });
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (req, resp) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return resp.status(400).json({
      message: "oldPassword and newPassword are required",
      success: false,
    });
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
    "Your account password was updated successfully. If this wasn't you, please contact support immediately.",
  );

  return resp
    .status(200)
    .json({ message: "Password updated successfully", success: true });
};

export const forgotPassword = async (req, resp) => {
  const { email } = req.body;

  if (!email) {
    return resp.status(400).json({
      message: "Email is required",
      success: false,
    });
  }

  const successResponse = {
    message: "If an account exists for this email, a reset link has been sent.",
    success: true,
  };

  const user = await User.findOne({ where: { email } });
  if (!user || !user.password) {
    return resp.status(200).json(successResponse);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    ENV_VARIABLES.RESET_PASSWORD_JWT_SECRET,
    { expiresIn: DURATIONS.RESET_PASSWORD_TOKEN_DURATION },
  );

  const expiresAt = new Date(
    Date.now() + DURATIONS.RESET_PASSWORD_TOKEN_DURATION_MS,
  );

  user.reset_password_token = token;
  user.reset_password_expires = expiresAt;
  await user.save();

  const resetLink = `${ENV_VARIABLES.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const htmlContent = resetPasswordMail(user.name, resetLink);

  sendEmail(
    user.email,
    "Reset your Virtual Trade Sandbox password",
    `Reset your password using this link: ${resetLink}`,
    htmlContent,
  ).catch((error) =>
    logger.error("Error sending reset password email:", error),
  );

  return resp.status(200).json(successResponse);
};

export const resetPasswordWithToken = async (req, resp) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return resp.status(400).json({
      message: "Token and new password are required",
      success: false,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, ENV_VARIABLES.RESET_PASSWORD_JWT_SECRET);
  } catch (error) {
    return resp.status(400).json({
      message: "Reset link is invalid or has expired",
      success: false,
    });
  }

  const user = await User.findOne({
    where: {
      id: decoded.userId,
      reset_password_token: token,
      reset_password_expires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return resp.status(400).json({
      message: "Reset link is invalid or has expired",
      success: false,
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.reset_password_token = null;
  user.reset_password_expires = null;
  user.refreshToken = null;
  await user.save();

  createNotification(
    user.id,
    "warning",
    "Password Reset Successful",
    "Your account password was reset successfully.",
  );

  return resp.status(200).json({
    message: "Password reset successfully",
    success: true,
  });
};

// ─── Update Profile Picture ───────────────────────────────────────────────────
export const updateProfilePicture = async (req, resp) => {
  if (!req.file) {
    return resp
      .status(400)
      .json({ message: "No image file provided", success: false });
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
    "info",
    "Profile Picture Updated",
    "Your profile photo has been changed successfully.",
  );

  return resp.status(200).json({
    user: userObject,
    message: "Profile picture updated successfully",
    success: true,
  });
};

// ─── Update Display Name ──────────────────────────────────────────────────────
export const updateDisplayName = async (req, resp) => {
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
    `Your display name has been changed to "${userObject.name}".`,
  );

  return resp.status(200).json({
    user: userObject,
    message: "Display name updated successfully",
    success: true,
  });
};

// ─── Update User Preferences ──────────────────────────────────────────────────
export const updatePreferences = async (req, resp) => {
  const { preferences } = req.body;
  if (!preferences) {
    return resp
      .status(400)
      .json({ message: "Preferences are required", success: false });
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
};

export const getUserStartingFunds = async (req, resp) => {
  const user = req.user;
  const userFunds = await User.findOne({
    where: {
      id: user.id,
    },
    attributes: ["actualFunds", "funds"],
  });
  if (!user) {
    return resp.status(404).json({ message: "user not found", success: false });
  }

  return resp
    .status(200)
    .json({ user: userFunds, message: "login success", success: true });
};
