'use strict';

require('dotenv').config();

/**
 * Require the dependencies
 * @type {*|createApplication}
 */
const express = require('express');

const app = express();
const path = require('path');
const { json, urlencoded } = require('body-parser');
const ngrok = process.env.NGROK_ENABLED === 'true' ? require('ngrok') : null;

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

require('./qboConnector')(app);
require('./stripeConnector')(app);

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