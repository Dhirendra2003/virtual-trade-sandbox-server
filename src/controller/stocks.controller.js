import Stock from "../models/Stock.js";
import stocksData from "../data/NSE_MIS_Data.json" with { type: "json" };
import { Op } from "sequelize";

export const searchStocks = async (req, resp) => {
  const { search } = req.query;
  if (!search || search.trim() === "") {
    return resp
      .status(400)
      .json({ message: "search query is required", success: false });
  }
  const normalizedSeachQuery = search
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, "%");
  const stocks = await Stock.findAll({
    where: {
      [Op.or]: [
        {
          name: {
            [Op.iLike]: `%${normalizedSeachQuery}%`,
          },
        },
        {
          trading_symbol: {
            [Op.iLike]: `%${normalizedSeachQuery}%`,
          },
        },
        {
          short_name: {
            [Op.iLike]: `%${normalizedSeachQuery}%`,
          },
        },
      ],
    },
    limit: 10,
  });

  return resp.status(200).json({ data: stocks, success: true });
};

export const getStockChartData = async (req, resp) => {
  const { stockCode, timeFrame, from, to } = req.query;
  console.log(stockCode, timeFrame, from, to);
  if (!stockCode || stockCode.length === 0) {
    return resp
      .status(400)
      .json({ message: "stockCode is required", success: false });
  }
  if (!timeFrame || timeFrame.length === 0) {
    return resp
      .status(400)
      .json({ message: "timeFrame is required", success: false });
  }
  if (!from || from.length === 0 || from === "undefined") {
    return resp
      .status(400)
      .json({ message: "from date is required", success: false });
  }
  if (!to || to.length === 0 || to === "undefined") {
    return resp
      .status(400)
      .json({ message: "to date is required", success: false });
  }
  let days = new Set();
  let modifiedData = [];
  const data = await fetch(
    `https://api.upstox.com/v3/historical-candle/${stockCode}/minutes/${timeFrame}/${to}/${from}`,
  )
    .then((responseData) => responseData.json())
    .then((responseData) => {
      console.log("API Response:", responseData); // Debug log
      responseData?.data?.candles?.map((candle) => {
        console.log(candle[0].slice(0, 10));
        days.add(candle[0].slice(0, 10));
      });
      modifiedData = responseData?.data?.candles?.map((candle) => ({
        date2: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));
      return { modifiedData, days };
    });
  return resp
    .status(200)
    .json({ data: modifiedData, days: [...days], success: true }); // Spread Set → Array so JSON.stringify works
};

export const saveStocksData = async (req, resp) => {
  await Stock.bulkCreate(stocksData);

  return resp
    .status(200)

    .json({ message: "stocks data saved", success: true });
};
