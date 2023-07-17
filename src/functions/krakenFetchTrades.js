const key = 'nSY9dXe75uQj8/9GuEVZataP+x1erdqZowQ/OLaRF1xiFGme11ihlfCs'; // API Key
const secret = 'hxHSkpQMSoNLu+C6755ZsFPTLxIrV0xNCm9AOS0wIrHNOhT60M8GaVz3mZjY7RMvBZSWAVBJ+VDsoabepeVC5A=='; // API Private Key

const { google } = require('googleapis');
const fs = require('fs');
const KrakenClient = require('kraken-api');
const kraken = new KrakenClient(key, secret);
const credentials = JSON.parse(fs.readFileSync(''));

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

// Add data to google sheets
async function addToGoogleSheets(trades){
  try {
    const auth = new google.auth.OAuth2(); 
    auth.setCredentials();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = ''; 
    const spreadsheetName = 'Test Sheet';
    const tradesData = trades;
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '${sheetName}!A1',
      valueInputOptions: 'RAW',
      resource: { values: tradesData }});
      console.log('SUCCESS:', response.data);
  } catch (error) {
    console.error('ERROR:', error);
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



(async () => {
  const pair = 'XETHZEUR';
  const availableBalance = await getBalance();
  const trades = await getTrades();
  const closedPositions = await getClosedOrders();
  for (const item in closedPositions){
      const unixTimestamp = closedPositions[item][1].opentm;
      const date = new Date(unixTimestamp);
      console.log(date);
  }
  addToGoogleSheets(trades);
//  console.log(closedPositions);
})();
