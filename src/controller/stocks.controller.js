import Stock from "../models/Stock.js";
import stocksDataNSE from "../data/NSE_MIS.json" with { type: "json" };
import stocksDataBSE from "../data/BSE_MIS.json" with { type: "json" };
import { Op, Sequelize } from "sequelize";
import Watchlist from "../models/watchlist.js";
import {
  getHistoricalCandles,
  getIntradayCandles,
  getLTP,
  // getMarketTimings,
  getMarketStatusAPI,
} from "../services/upstox.service.js";
import {
  fetchNews,
  fetchStockInfo,
  fetchTrendingStocks,
} from "../services/indStockAPI.service.js";
import getGeminiResponse from "../services/gemini.service.js";

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
  const user = req.user;
  const { stockCode, timeFrame, from, to } = req.query;
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
  const intradayData = await getIntradayCandles(stockCode, timeFrame).then(
    (responseData) => {
      // console.log("API Response:", responseData); // Debug log
      responseData?.data?.candles?.map((candle) => {
        // console.log(candle[0].slice(0, 10));
        days.add(candle[0].slice(0, 10));
      });
      modifiedData.push(
        ...responseData?.data?.candles?.map((candle) => ({
          date2: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
        })),
      );
      return { modifiedData, days };
    },
  );
  const data = await getHistoricalCandles(stockCode, timeFrame, from, to).then(
    (responseData) => {
      // console.log("API Response:", responseData); // Debug log
      responseData?.data?.candles?.map((candle) => {
        // console.log(candle[0].slice(0, 10));
        days.add(candle[0].slice(0, 10));
      });
      modifiedData.push(
        ...responseData?.data?.candles?.map((candle) => ({
          date2: candle[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5],
        })),
      );
      return { modifiedData, days };
    },
  );
  const stockDetails = await Stock.findOne({
    where: {
      instrument_key: stockCode,
    },
    raw: true,
  });
  const stockLTPdata = await getLTP(stockCode);
  const stockLTPobject = Object.values(stockLTPdata.data)[0];
  const isAddedToWatchlist = await Watchlist.findOne({
    where: {
      instrument_key: stockCode,
      user_id: user.id,
    },
    raw: true,
  });
  return resp.status(200).json({
    data: modifiedData,
    days: [...days],
    stockDetails: stockDetails && stockDetails,
    isAddedToWatchlist: isAddedToWatchlist ? true : false,
    stockLTPobject: stockLTPobject,
    success: true,
  }); // Spread Set → Array so JSON.stringify works
};

export const getMarketStatus = async (req, resp) => {
  const data = await getMarketStatusAPI();

  if (data?.data?.length === 0) {
    return resp
      .status(200)
      .json({ isMarketOpen: false, message: "no data found", success: false });
  }

  return resp.status(200).json({
    isMarketOpen: data?.data?.status === "NORMAL_OPEN",
    data: data,
    success: true,
  });
};

export const getStockNews = async (req, resp) => {
  const data = await fetchNews();
  return resp.status(200).json({ data: data, success: true });
};

export const getStockInfo = async (req, resp) => {
  const { symbol } = req.params;
  const data = await fetchStockInfo(symbol);
  const filteredData = {
    companyName: data?.companyName,
    industry: data?.industry,
    riskMeter: data?.riskMeter,
    companyDescription: data?.companyProfile?.companyDescription,
    peerCompanyList: data?.companyProfile?.peerCompanyList,
    shareholding: data?.shareholding,
    recentNews: data?.recentNews,
  };
  return resp.status(200).json({ data: filteredData, success: true });
};

export const getTrendingStocks = async (req, resp) => {
  const data = await fetchTrendingStocks();
  //attach the instrument_key from upstox data and only give out stocks which have instrument_key attached
  const topGainers = data?.trending_stocks?.top_gainers;
  const topLosers = data?.trending_stocks?.top_losers;

  const normalizeFn = (col, searchName) => {
    return Sequelize.where(
      Sequelize.fn(
        "REGEXP_REPLACE",
        Sequelize.col(col),
        "[^a-zA-Z0-9]+",
        " ",
        "g",
      ),
      { [Op.iLike]: `%${searchName}%` },
    );
  };
  const modifiedGainersData = await Promise.all(
    topGainers.map(async (stock) => {
      // Replace non-alphanumeric symbols with spaces in JS
      const searchName = stock.company_name.replace(/[^a-zA-Z0-9]+/g, " ");
      // console.log("### searchName", searchName);
      // check if stock name is more than 3 words
      let secondName;
      const words = searchName.split(" ");
      if (words.length >= 3) {
        secondName = words.slice(0, 2).join(" ");
        // console.log("### secondName", secondName);
      }
      const stockDetails = await Stock.findOne({
        where: {
          [Op.or]: [
            // Strip out symbols dynamically from the DB columns using REGEXP_REPLACE before comparing
            normalizeFn("name", searchName),
            normalizeFn("trading_symbol", searchName),
            normalizeFn("short_name", searchName),
            secondName && normalizeFn("name", secondName),
            secondName && normalizeFn("trading_symbol", secondName),
            secondName && normalizeFn("short_name", secondName),
          ],
        },
        raw: true,
      });

      // console.log(`${stock.company_name} : ${stockDetails?.trading_symbol}`);
      return {
        ...stock,
        instrument_key: stockDetails?.instrument_key,
      };
    }),
  );

  const modifiedLosersData = await Promise.all(
    topLosers.map(async (stock) => {
      // Replace non-alphanumeric symbols with spaces in JS
      const searchName = stock.company_name.replace(/[^a-zA-Z0-9]+/g, " ");
      // console.log("### searchName", searchName);
      // check if stock name is more than 3 words
      let secondName;
      const words = searchName.split(" ");
      if (words.length >= 3) {
        secondName = words.slice(0, 2).join(" ");
        // console.log("### secondName", secondName);
      }
      const stockDetails = await Stock.findOne({
        where: {
          [Op.or]: [
            // Strip out symbols dynamically from the DB columns using REGEXP_REPLACE before comparing
            normalizeFn("name", searchName),
            normalizeFn("trading_symbol", searchName),
            normalizeFn("short_name", searchName),
            secondName && normalizeFn("name", secondName),
            secondName && normalizeFn("trading_symbol", secondName),
            secondName && normalizeFn("short_name", secondName),
          ],
        },
        raw: true,
      });

      // console.log(`${stock.company_name} : ${stockDetails?.trading_symbol}`);
      return {
        ...stock,
        instrument_key: stockDetails?.instrument_key,
      };
    }),
  );

  return resp.status(200).json({
    data: {
      top_gainers: modifiedGainersData,
      top_losers: modifiedLosersData,
    },
    success: true,
  });
};

export const getDailyRecommendations = async (req, resp) => {
  const prompt = `Give me the top 5 stocks to buy in NSE today based on latest available real market data.

STRICT INSTRUCTIONS:

Use recent NSE data (last trading session or latest available intraday data) from reliable sources like NSE India, Moneycontrol, or similar.
Ensure buyPrice is close to actual current/last traded price (LTP) — avoid rounded or unrealistic numbers.
Prices must be within a realistic range (±2-3%) of actual market price.
Use recent technical indicators such as:
Support & Resistance
Moving Averages (20/50 EMA or SMA)
RSI (Relative Strength Index)
Volume trend
Breakouts / consolidation patterns
Prefer liquid large-cap or actively traded stocks (Nifty 50 or high-volume stocks).
Avoid penny stocks or illiquid stocks.

OUTPUT FORMAT RULES:

Return ONLY a valid JSON array.
No markdown, no explanation, no extra text.

Each object must follow:
[
{
"symbol": "RELIANCE",
"name": "Reliance Industries",
"buyPrice": 2850,
"targetPrice": 2950,
"stopLoss": 2790,
"technicalAnalysis": "Price near 20 EMA support, RSI ~55 showing strength, breakout above resistance with strong volume."
}
]

VALIDATION RULES:

buyPrice ≈ latest LTP
targetPrice = realistic (2–5% upside for intraday/swing)
stopLoss = logical support level
technicalAnalysis must be specific, not generic

If real-time data is unavailable, use most recent closing price and clearly base analysis on that but still keep numbers realistic`;
  try {
    const rawData = await getGeminiResponse(prompt);
    // Clean up potential markdown formatting from the response
    const cleanedData = rawData
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const data = JSON.parse(cleanedData);
    const modifiedData = await Promise.all(
      data.map(async (stock) => {
        const stockDetails = await Stock.findOne({
          where: {
            trading_symbol: stock.symbol,
          },
          raw: true,
        });
        if (!stockDetails) {
          return null;
        }
        return {
          ...stock,
          instrument_key: stockDetails?.instrument_key,
        };
      }),
    );
    return resp.status(200).json({ data: modifiedData, success: true });
  } catch (error) {
    console.error("Gemini Error:", error);
    return resp.status(500).json({
      message: "Failed to generate recommendations",
      success: false,
      error: error.message,
    });
  }
};

export const saveStocksData = async (req, resp) => {
  const allStocks = [...stocksDataBSE, ...stocksDataNSE];
  await Stock.bulkCreate(allStocks, {
    updateOnDuplicate: [
      "segment",
      "name",
      "exchange",
      "instrument_type",
      "trading_symbol",
      "short_name",
    ],
  });

  return resp.status(200).json({
    message: "stocks data saved",
    success: true,
    count: allStocks.length,
  });
};
