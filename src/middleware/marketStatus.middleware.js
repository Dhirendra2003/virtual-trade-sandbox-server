import { getMarketStatusAPI } from "../services/upstox.service.js";

const marketStatusMiddleware = async (req, response, next) => {
  const data = await getMarketStatusAPI();

  if (data?.data?.length === 0) {
    return response
      .status(200)
      .json({ isMarketOpen: false, message: "no data found", success: false });
  }
  req.isMarketOpen = data?.data?.status === "NORMAL_OPEN";
  // req.isMarketOpen = true; // to simulate open market

  next();
};
export default marketStatusMiddleware;
