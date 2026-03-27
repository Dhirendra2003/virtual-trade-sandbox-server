const upstoxFetcher = async (url) => {
  const response = await fetch(`https://api.upstox.com${url}`, {
    headers: { Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}` },
  });
  if (!response.ok) {
    throw new Error(`Upstox API Error: ${response.statusText}`);
  }
  return response.json();
};

export const getHistoricalCandles = (stockCode, timeFrame, from, to) => {
  return upstoxFetcher(
    `/v3/historical-candle/${stockCode}/minutes/${timeFrame}/${to}/${from}`,
  );
};

export const getMarketTimings = (dateStr) => {
  return upstoxFetcher(`/v2/market/timings/${dateStr}`);
};

export const getMarketStatusAPI = () => {
  return upstoxFetcher(`/v2/market/status/NSE`);
};
