// This example shows how to make a decentralized price feed using multiple APIs

// Arguments can be provided when a request is initated on-chain and used in the request source code as shown below
const coinCapCoinId = args[0];
const coinGeckoCoinId = args[1];
const coinPaprikaCoinId = args[2];

// build HTTP request objects
const coinCapRequest = Functions.makeHttpRequest({
  url: `https://api.coincap.io/v2/assets/${coinCapCoinId}`,
  headers: {
    "Content-Type": "application/json",
  },
});

const coinGeckoRequest = Functions.makeHttpRequest({
  url: `https://api.coingecko.com/api/v3/simple/price`,
  headers: {
    "Content-Type": "application/json",
  },
  params: {
    ids: coinGeckoCoinId,
    vs_currencies: "usd",
  },
});

const coinPaprikaRequest = Functions.makeHttpRequest({
  url: `https://api.coinpaprika.com/v1/tickers/${coinPaprikaCoinId}`,
  headers: {
    "Content-Type": "application/json",
  },
});
// First, execute all the API requests are executed concurrently, then wait for the responses
const [coinCapResponse, coinGeckoResponse, coinPaprikaResponse] =
  await Promise.all([
    coinCapRequest,
    coinGeckoRequest,
    coinPaprikaRequest,
  ]);

const prices = [];

if (!coinCapResponse.error) {
  prices.push(coinCapResponse.data.data.priceUsd);
} else {
  console.log("CoinMarketCap Error");
}

if (!coinGeckoResponse.error) {
  prices.push(coinGeckoResponse.data[coinGeckoCoinId].usd);
} else {
  console.log("CoinGecko Error");
}
if (!coinPaprikaResponse.error) {
  prices.push(coinPaprikaResponse.data.quotes.USD.price);
} else {
  console.log("CoinPaprika Error");
}

// At least 2 out of 3 prices are needed to aggregate the median price
if (prices.length < 2) {
  // If an error is thrown, it will be returned back to the smart contract
  throw Error("More than 1 API failed");
}

// fetch the price
const medianPrice = prices.sort((a, b) => a - b)[Math.round(prices.length / 2)];
console.log(`Median Bitcoin price: $${medianPrice.toFixed(2)}`);

// price * 100 to move by 2 decimals (Solidity doesn't support decimals)
// Math.round() to round to the nearest integer
// Functions.encodeUint256() helper function to encode the result from uint256 to bytes
return Functions.encodeUint256(Math.round(medianPrice * 100));
