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

export const getLTP = async (instrument_key) => {
  if (!instrument_key) {
    return null;
  }
  if (Array.isArray(instrument_key) && instrument_key.length > 1) {
    instrument_key = instrument_key.join(",");
  } else if (Array.isArray(instrument_key) && instrument_key.length === 1) {
    instrument_key = instrument_key[0];
  }
  const data = await upstoxFetcher(
    `/v3/market-quote/ltp?instrument_key=${instrument_key}`,
  );
  const newData = {
    ...data,
    data: Object.fromEntries(
      Object.entries(data.data).map(([key, value]) => {
        value["change"] = (value.last_price - value.cp).toFixed(2);
        value["change_percent"] = (
          ((value.last_price - value.cp) / value.cp) *
          100
        ).toFixed(2);
        return [key, value];
      }),
    ),
  };
  return newData;
};
