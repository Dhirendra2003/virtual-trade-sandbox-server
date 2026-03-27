//need to build a load balancer for this api to rotate keys and make calls avoiding exhaustion of keys
const API_KEYS = [
  process.env.INDIANAPI_KEY0,
  process.env.INDIANAPI_KEY1,
  process.env.INDIANAPI_KEY2,
  // ... up to 10
];

let currentIndex = 0;
const getNextKey = () => {
  const key = API_KEYS[currentIndex];
  currentIndex = (currentIndex + 1) % API_KEYS.length;
  return key;
};

const indAPIFetcher = async (url) => {
  const response = await fetch(`https://stock.indianapi.in${url}`, {
    headers: { "X-Api-Key": getNextKey() },
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
