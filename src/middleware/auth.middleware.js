import jwt from "jsonwebtoken";
const checkLoggedIn = async (req, response, next) => {
  try {
    const accesstoken = req.cookies.accesstoken;
    if (!accesstoken) {
      return response
        .status(401)
        .json({
          message: "user not authenticated",
          success: false,
          tokenExpired: true,
        });
    }
    const decoded = jwt.verify(accesstoken, process.env.ACC_JWT_SECRET);
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
    console.log(error);
    if (error.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Access token expired",
        success: false,
        tokenExpired: true, // Flag to trigger refresh on frontend
      });
    }

    console.log(error);
    return response.status(403).json({
      message: "Invalid token",
      success: false,
    });
  }
};
export default checkLoggedIn;
