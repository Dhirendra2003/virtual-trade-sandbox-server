const indAPIFetcher = async (url) => {
  const response = await fetch(`https://stock.indianapi.in${url}`, {
    headers: { "X-Api-Key": process.env.INDIANAPI_KEY },
  });
  if (!response.ok) {
    throw new Error(`IndianAPI Error: ${response.statusText}`);
  }
  return response.json();
};

export const fetchNews = () => {
  return indAPIFetcher("/news");
};

export const fetchTrendingStocks = () => {
  return indAPIFetcher("/trending");
};
