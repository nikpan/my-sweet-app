'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const { json, urlencoded } = require('body-parser');
const urlencodedParser = urlencoded({ extended: false });

/**
 * Configure View and Handlebars
 */
app.use(urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(json());

let redirectUri = '';

/**
 * Home Route
 */
app.get('/', function (req, res) {
  res.render('index');
});

const StripeConnection = require('./src/stripeConnector');
const QBOConnection = require('./src/qboConnector');
const stripeConnection = new StripeConnection();
const qboConnection = new QBOConnection();

/**
 * stripeCallback - callback from stripe OAuth
 */
app.get('/stripeCallback', function (req, res) {
  console.log('stripeCallback called');
  stripeConnection.handleStripeOAuthCallback(req.query.code)
  .then(() => {
    stripeConnection.printState();
    res.send('stripeCallback response');
  })
});

/**
 * getStripeCompanyInfo - get the company info for the connected stripe account
 */
app.get('/getStripeCompanyInfo', async function (_req, res) {
  console.log('getStripeCompanyInfo called');
  let companyInfo = await stripeConnection.getCompanyInfo();
  res.send(companyInfo);
})

/**
 * getStripeTransactions - get transactions from stripe account
 */
app.get('/getStripeTransactions', async function (_req, res) {
  console.log('getStripeTransactions called');
  let customers = await stripeConnection.getStripeCustomers();
  let charges = await stripeConnection.getStripeTransactions();
  storeCustomers(customers);
  for (let i = 0; i < charges.length; i++) {
    let charge = charges[i];
    let customer = getCustomerById(charge.customerId);
    let qboSalesReceiptId = await getSalesReceiptIdByPaymentRef(charge.id);
    charge.customerEmail = customer.email;
    charge.customerName = customer.name;
    charge.qboSalesReceiptId = qboSalesReceiptId;
  }
  res.send({list: charges});
});

/**
 * disconnectStripe - disconnect stripe account and delete connected account data
 */
app.get('/disconnectStripe', function (req, res) {
  console.log('disconnectStripe called');
  stripeConnection = new StripeConnection();
  res.send('disconnectStripe response');
});

/**
   * Get the AuthorizeUri for Intuit connect
   */
 app.get('/authUri', urlencodedParser, function (_req, res) {
  res.send(qboConnection.getAuthUri());
});

/**
 * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
 */
app.get('/callback', function (req, res) {
  qboConnection.handleIntuitOAuthCallback(req.url, req.query.realmId)
  .then(() => {
    qboConnection.printState();
    res.send('intuit authcallback response');
  });
});

/**
 * getCompanyInfo - get company info for connected intuit account
 */
app.get('/getCompanyInfo', function (_req, res) {
  qboConnection.getCompanyInfo()
  .then(companyInfo => {
    res.send(companyInfo);
  })
  .catch(err => {
    console.debug(err);
  })
});

/**
 * refreshAccessToken - Refresh the access-token
 */
app.get('/refreshAccessToken', function (_req, res) {
  qboConnection.refreshAccessToken()
  .then(newAuthToken => {
    res.send(JSON.stringify(newAuthToken, null, 2));
  });
});

/**
 * create a sales receipt in QBO company
 */
app.post('/createSalesReceipt', function (req, res) {
  console.debug(JSON.stringify(req.body, null, 2));
  var stripeTransaction = req.body;
  qboConnection.createSalesReceipt(stripeTransaction.amount/100, stripeTransaction.description, stripeTransaction.createdTime, stripeTransaction.id, stripeTransaction.customerEmail, stripeTransaction.customerName)
  .then(() => {
    res.send('createSalesReceipt done!');
  });
});

/**
 * disconnect - Disconnect connected intuit account
 */
app.get('/disconnect', function (_req, res) {
  res.redirect(qboConnection.getDisconnectUri());
});

let customers = [];

async function getSalesReceiptIdByPaymentRef(stripeChargeId) {
  let salesReceipt = await qboConnection.getSalesReceiptByPaymentRef(stripeChargeId);
  if(salesReceipt && salesReceipt.SalesReceipt && salesReceipt.SalesReceipt[0] && salesReceipt.SalesReceipt[0].DocNumber) {
    return salesReceipt.SalesReceipt[0].DocNumber;
  } else {
    return -1;
  }
}

function storeCustomers(customersData) {
  customers = customersData;
}

function getCustomerById(customerId) {
  var customerInfo = null;
  for (let i = 0; i < customers.length; i++) {
    if(customers[i].id === customerId) {
      customerInfo = customers[i];
      break;
    }
  }
  if(customerInfo !== null) {
    return {
      email: customerInfo.email,
      name: customerInfo.name
    }
  } else {
    return {
      email: '',
      name: ''
    };
  }
}

/**
 * Start server on HTTP
 */
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`Server listening on port ${server.address().port}`);
  redirectUri = `${server.address().port}` + '/callback';
  console.log(
    `Paste this URL in your browser to access the app: http://localhost:${server.address().port}`,
  );
});