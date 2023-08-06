const key = ''; // API Key
const secret = '';

const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const fs = require('fs').promises;
const path = require('path');
const KrakenClient = require('kraken-api');
const kraken = new KrakenClient(key, secret);
// const credentials = JSON.parse(fs.readFileSync(''));

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

// Get all trades for asset
async function getTrades() {
  try {
    const response = await kraken.api('TradesHistory');
    return response.result;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get trades from Kraken API');
  }
}

// Get closed orders
async function getClosedOrders() {
  try {
    const response = await kraken.api('ClosedOrders');
    const filtered = Object.entries(response.result.closed)
      .filter(([_, position]) => position.status === 'closed');
    return filtered;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to get closed positions from Kraken API');
  }
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; 
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Add data to google sheets
async function addToGoogleSheets(trades){
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = ''; 
    const spreadsheetName = '';
    let tradesData = (Object.entries(trades)
      .map(([_, val]) => val)
      .filter(([_, trade]) => trade.status === 'closed')
      .reverse()
      .map(([_, trade]) => [
          new Date(trade.closetm * 1000).toLocaleDateString('en-GB'),
          Math.round(trade.price * trade.vol_exec),
          Number(trade.price),
          Number(trade.vol_exec)
      ]));
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: spreadsheetName + '!A2',
      valueInputOption: 'RAW',
      resource: { values: tradesData }});
      console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error);
  }
}

(async () => {
  const closedPositions = await getClosedOrders();
  addToGoogleSheets(closedPositions);
})();
