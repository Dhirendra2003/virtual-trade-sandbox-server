import jwt from "jsonwebtoken";
import { ENV_VARIABLES } from "../utils/constants.js";
import logger from "../utils/errorLogger.js";
const checkLoggedIn = async (req, response, next) => {
  try {
    const accesstoken = req.cookies.accesstoken;
    if (!accesstoken) {
      return response.status(401).json({
        message: "user not authenticated",
        success: false,
        tokenExpired: true,
      });
    }
    const decoded = jwt.verify(accesstoken, ENV_VARIABLES.ACC_JWT_SECRET);
    if (!decoded) {
      return response
        .status(401)
        .json({ message: "Token invalid", success: false, tokenExpired: true });
    }
    // console.log(decoded);
    // req.id=decoded.id

    //attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(error);
    if (error.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Access token expired",
        success: false,
        tokenExpired: true, // Flag to trigger refresh on frontend
      });
    }

    return response.status(401).json({
      message: "Invalid token",
      success: false,
    });
  }
};
export default checkLoggedIn;
