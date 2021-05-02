'use strict';

require('dotenv').config();

/**
 * Require the dependencies
 * @type {*|createApplication}
 */
const express = require('express');

const app = express();
const path = require('path');
const OAuthClient = require('intuit-oauth');
const bodyParser = require('body-parser');
const ngrok = process.env.NGROK_ENABLED === 'true' ? require('ngrok') : null;
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Configure View and Handlebars
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');
app.use(bodyParser.json());

const urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * App Variables
 * @type {null}
 */
let oauth2_token_json = null;
let redirectUri = '';

/**
 * Instantiate new Client
 * @type {OAuthClient}
 */

let oauthClient = null;

/**
 * Home Route
 */
app.get('/', function (req, res) {
  res.render('index');
});


/**
 * Keys for the App. These keys are app specific. 
 * Not specific to the user of the app but specific for the app as a whole
 */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENVIRONMENT = process.env.ENVIRONMENT;
const REDIRECT_URI = process.env.REDIRECT_URI;
/**
 * Get the AuthorizeUri
 */
app.get('/authUri', urlencodedParser, function (req, res) {
  console.debug(CLIENT_ID);
  console.debug(CLIENT_SECRET);
  console.debug(ENVIRONMENT);
  console.debug(REDIRECT_URI);
  console.debug(redirectUri);

  oauthClient = new OAuthClient({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    environment: ENVIRONMENT,
    redirectUri: redirectUri,
  });

  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
    state: 'intuit-test',
  });
  res.send(authUri);
});

/**
 * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
 */
app.get('/callback', function (req, res) {
  oauthClient
    .createToken(req.url)
    .then(function (authResponse) {
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
    })
    .catch(function (e) {
      console.error(e);
    });

  res.send('');
});

/**
 * Display the token : CAUTION : JUST for sample purposes
 */
app.get('/retrieveToken', function (req, res) {
  res.send(oauth2_token_json);
});

/**
 * Refresh the access-token
 */
app.get('/refreshAccessToken', function (req, res) {
  oauthClient
    .refresh()
    .then(function (authResponse) {
      console.log(`The Refresh Token is  ${JSON.stringify(authResponse.getJson())}`);
      oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
      res.send(oauth2_token_json);
    })
    .catch(function (e) {
      console.error(e);
    });
});

/**
 * getCompanyInfo ()
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
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
    });
});

/**
 * disconnect ()
 */
app.get('/disconnect', function (req, res) {
  console.log('The disconnect called ');
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.OpenId, OAuthClient.scopes.Email],
    state: 'intuit-test',
  });
  res.redirect(authUri);
});

/**
 * authStripe ()
 */
app.get('/authStripe', function (req, res) {
  console.log('authStripe called');
  res.send('authStripe response');
})

/**
 * callback from stripe auth. Save the account_id here.
 */

var connected_account_id = '';

app.get('/stripeCallback', function (req, res) {
  console.log('stripeCallback called');
  console.log(req.url);
  console.log(req.query.code);
  stripe.oauth.token({
    grant_type: 'authorization_code',
    code: req.query.code
  }).then((response) => {
    connected_account_id = response.stripe_user_id;
    console.debug(response);
  }).catch(err => {
    console.debug(err);
  });
  
  res.send('stripeCallback response');
})
/**
 * getStripeTransactions ()
 */
app.get('/getStripeTransactions', function (req, res) {
  console.log('getStripeTransactions called');
  // Fetching an account just needs the ID as a parameter
  stripe.accounts.retrieve(connected_account_id)
  .then(account => {
    console.log('Account Info');
    const accountInfo = {
      id: account.id,
      displayName: account.settings.dashboard.display_name
    }
    console.debug(accountInfo);
    return accountInfo;
  })
  .then(accountInfo => {
    console.log('next promise');
    return stripe.charges.list({}, {
      stripeAccount: accountInfo.id
    });
  })
  .then((charges) => {
    console.log('list of charges returned');
    var chargeList = [];
    charges.data.forEach(element => {
      chargeList.push({
        id: element.id,
        amount: element.amount,
        description: element.description
      });
    });
    console.debug(chargeList);
    console.log('sending getStripeTransactions response');
    res.send({list: chargeList});
  })
  .catch(err => {
    console.debug(err);
  })
})

/**
 * disconnectStripe ()
 */
app.get('/disconnectStripe', function (req, res) {
  console.log('disconnectStripe called');
  res.send('disconnectStripe response');
})

/**
 * Start server on HTTP (will use ngrok for HTTPS forwarding)
 */
const server = app.listen(process.env.PORT || 8000, () => {
  console.log(`💻 Server listening on port ${server.address().port}`);
  if (!ngrok) {
    redirectUri = `${server.address().port}` + '/callback';
    console.log(
      `💳  Step 1 : Paste this URL in your browser : ` +
        'http://localhost:' +
        `${server.address().port}`,
    );
    console.log(
      '💳  Step 2 : Copy and Paste the clientId and clientSecret from : https://developer.intuit.com',
    );
    console.log(
      `💳  Step 3 : Copy Paste this callback URL into redirectURI :` +
        'http://localhost:' +
        `${server.address().port}` +
        '/callback',
    );
    console.log(
      `💻  Step 4 : Make Sure this redirect URI is also listed under the Redirect URIs on your app in : https://developer.intuit.com`,
    );
  }
});

/**
 * Optional : If NGROK is enabled
 */
if (ngrok) {
  console.log('NGROK Enabled');
  ngrok
    .connect({ addr: process.env.PORT || 8000 })
    .then((url) => {
      redirectUri = `${url}/callback`;
      console.log(`💳 Step 1 : Paste this URL in your browser :  ${url}`);
      console.log(
        '💳 Step 2 : Copy and Paste the clientId and clientSecret from : https://developer.intuit.com',
      );
      console.log(`💳 Step 3 : Copy Paste this callback URL into redirectURI :  ${redirectUri}`);
      console.log(
        `💻 Step 4 : Make Sure this redirect URI is also listed under the Redirect URIs on your app in : https://developer.intuit.com`,
      );
    })
    .catch(() => {
      process.exit(1);
    });
}
