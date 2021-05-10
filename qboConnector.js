const { urlencoded } = require('body-parser');
const QuickBooks = require('node-quickbooks');
const OAuthClient = require('intuit-oauth');
const { response } = require('express');
const urlencodedParser = urlencoded({ extended: false });

/**
 * App Variables
 */
let qbo = null;
let oauth2TokenJsonString = null;
let oauthClient = null;

/**
 * Keys for the App. These keys are app specific. 
 * Not specific to the user of the app but specific for the app as a whole
 */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENVIRONMENT = process.env.ENVIRONMENT;
const REDIRECT_URI = process.env.REDIRECT_URI;

module.exports = function(app) {
  /**
   * Get the AuthorizeUri for Intuit connect
   */
  app.get('/authUri', urlencodedParser, function (req, res) {
    oauthClient = new OAuthClient({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      environment: ENVIRONMENT,
      redirectUri: REDIRECT_URI,
    });

    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'intuit-test',
    });
    res.send(authUri);
  });

  /**
   * Display the token : CAUTION : JUST for sample purposes
   */
  app.get('/retrieveToken', function (req, res) {
    res.send(oauth2TokenJsonString);
  });

  /**
   * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
   */
  app.get('/callback', function (req, res) {
    oauthClient
      .createToken(req.url)
      .then(function (authResponse) {
        var authTokenJsonObj = authResponse.getJson();
        oauth2TokenJsonString = JSON.stringify(authTokenJsonObj, null, 2);
        qbo = new QuickBooks(CLIENT_ID,
          CLIENT_SECRET,
          authTokenJsonObj.access_token,
          false, // no token secret for oAuth 2.0
          req.query.realmId,
          true, // use the sandbox?
          false, // enable debugging?
          null, // set minorversion, or null for the latest version
          '2.0', //oAuth version
          authTokenJsonObj.refresh_token);
      })
      .catch(function (e) {
        console.error(e);
      });

    res.send('');
  });

  /**
   * get names of all accounts in QBO company
   */
  app.get('/getAccounts', function (req, res) {
    var accountNameList = [];
    if(qbo) {
      console.debug('Printing account list');
      qbo.findAccounts({}, function(err, accounts) {
        if(err) console.debug(err);
        else {
          accounts.QueryResponse.Account.forEach(function(account) {
            accountNameList.push(account.Name);
          });
        }
      });
    }
    res.send(accountNameList);
  });
  
  /**
   * getCompanyInfo - get company info for connected intuit account
   */
  app.get('/getCompanyInfo', function (req, res) {
    const companyID = oauthClient.getToken().realmId;

    const url =
      oauthClient.environment == 'sandbox'
        ? OAuthClient.environment.sandbox
        : OAuthClient.environment.production;

    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/companyinfo/${companyID}` })
      .then(function (authResponse) {
        console.log(`The response for API call is :${JSON.stringify(authResponse, null, 4)}`);
        res.send(JSON.parse(authResponse.text()));
      })
      .catch(function (e) {
        console.error(e);
      });
  });

  /**
   * refreshAccessToken - Refresh the access-token
   */
  app.get('/refreshAccessToken', function (req, res) {
    oauthClient
      .refresh()
      .then(function (authResponse) {
        console.log(`The Refresh Token is  ${JSON.stringify(authResponse.getJson())}`);
        oauth2TokenJsonString = JSON.stringify(authResponse.getJson(), null, 2);
        res.send(oauth2TokenJsonString);
      })
      .catch(function (e) {
        console.error(e);
      });
  });

  /**
   * get a sales receipt in QBO company
   */
  app.get('/getSalesReceipt', function (req, res) {
    var salesReceipt;
    var salesReceiptId = req.query.id;
    qbo.getSalesReceipt(salesReceiptId, function (err, salesReceiptResponse) {
      if (err) {
        console.log('error getting sales receipt');
        console.debug(err);
        salesReceipt = null
      } else {
        console.debug(salesReceiptResponse);
        salesReceipt = salesReceiptResponse;
      }
      res.send(salesReceipt);
    });
  });

  /**
   * create a sales receipt in QBO company
   */
  app.post('/createSalesReceipt', function (req, res) {
    console.debug(JSON.stringify(req.body, null, 2));
    var stripeTransaction = req.body;
    createSalesReceipt(stripeTransaction.amount/100, stripeTransaction.description, stripeTransaction.createdTime, stripeTransaction.id, stripeTransaction.customerEmail, stripeTransaction.customerName);
    res.send('createSalesReceipt response');
  });

  /**
   * disconnect - Disconnect connected intuit account
   */
  app.get('/disconnect', function (req, res) {
    console.log('The disconnect called ');
    const authUri = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.OpenId, OAuthClient.scopes.Email],
      state: 'intuit-test',
    });
    res.redirect(authUri);
  });
}

function createSalesReceipt(amount, description, date, stripeId, email, customerName) {
  var receipt = {
    Line: [
      {
        Id: -1,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          Qty: 1,
          UnitPrice: amount
        },
        Amount: amount,
        Description: description,
        LineNum: 1,
      }
    ],
    TxnDate: date,
    PaymentRefNum: stripeId,
    BillEmail: { Address: email },
  };

  qbo.createSalesReceipt(receipt, function (err, salesReceiptResponse) {
    if (err) {
      console.log('error creating sales receipt');
      console.debug(err);
      console.debug(err.Fault.Error);
    } else {
      console.debug(salesReceiptResponse);
    }
  });
}

function getSalesReceipt(salesReceiptId) {
  qbo.getSalesReceipt(salesReceiptId, function (err, salesReceiptResponse) {
    if (err) {
      console.log('error getting sales receipt');
      console.debug(err);
      return null;
    } else {
      console.debug(salesReceiptResponse);
      return salesReceiptResponse;
    }
  });
}