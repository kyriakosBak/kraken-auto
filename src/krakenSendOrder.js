const config = require('config');
const IS_TEST_ORDER = config.get('kraken.isTestOrder')
const key = config.get('kraken.apiKey'); // API Key
const secret = config.get('kraken.apiSecret'); // API Private Key
const KrakenClient = require('kraken-api');
const kraken = new KrakenClient(key, secret);

// Get current account balance
async function getBalance() {
  try {
    const response = await kraken.api('Balance');
    return response.result;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get account balance from Kraken API');
  }
}

// Get pair ask price
async function getMidPrice(pair) {
  try {
    const response = await kraken.api('Ticker', { pair });
    return ((Number(response.result[pair].a[0]) + Number(response.result[pair].b[0])) / 2).toFixed(2);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get ask price from Kraken API');
  }
}

// Get open orders
async function getOpenOrders() {
  try {
    const response = await kraken.api('OpenOrders');
    return response.result.open;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get open orders from Kraken API');
  }
}

// Send order
async function sendOrder(pair, type, price, volume) {
  try {
    const response = await kraken.api('AddOrder', {
      pair,
      type,
      ordertype: 'limit',
      price,
      volume,
      // oflags: 'post', // Make the order post-only
      validate: IS_TEST_ORDER
    });
    return response.result;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send order using Kraken API');
  }
}

(async () => {
  const pair = 'XETHZEUR';
  const eurosToSpend = 150;
  const availableBalance = await getBalance();
  if (availableBalance.ZEUR < eurosToSpend) {
    let msg = `Not enough euros to spend. Available balance: ${availableBalance.ZEUR}. ` +
      `Trying to spend: ${eurosToSpend}`;
    throw new Error(msg);
  }
  const midPrice = await getMidPrice(pair);
  const ethToBuy = eurosToSpend / midPrice;
  const result = await sendOrder(pair, 'buy', midPrice, ethToBuy);
  console.log(result);
})();
