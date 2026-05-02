import Stock from "../models/stock.js";
import Watchlist from "../models/watchlist.js";
import { Op } from "sequelize";
import moment from "moment";
import logger from "../utils/errorLogger.js";

export const getUserWatchlist = async (req, resp) => {
  const userId = req.user.id;
  const watchlist = await Watchlist.findAll({
    where: {
      user_id: userId,
    },
    include: [
      {
        model: Stock,
      },
    ],
  });
  return resp.status(200).json({
    data: watchlist,
    success: true,
  });
};

export const addToWatchlist = async (req, resp) => {
  try {
    const userId = req.user.id;
    const { stockCode } = req.body;
    const alreadyExists = await Watchlist.findOne({
      where: {
        user_id: userId,
        instrument_key: stockCode,
      },
    });
    if (alreadyExists) {
      return resp.status(400).json({
        message: "Stock already exists in watchlist",
        success: false,
      });
    }
    const watchlist = await Watchlist.create({
      user_id: userId,
      instrument_key: stockCode,
    });
    return resp.status(201).json({
      data: watchlist,
      success: true,
    });
  } catch (error) {
    logger.error(error);
    return resp.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const removeFromWatchlist = async (req, resp) => {
  const userId = req.user.id;
  const { stockCode } = req.body;
  const watchlist = await Watchlist.destroy({
    where: {
      user_id: userId,
      instrument_key: stockCode,
    },
  });
  return resp.status(200).json({
    data: watchlist,
    success: true,
  });
};
