const OAuthClient = require('intuit-oauth');

/**
 * Keys for the App. These keys are app specific. 
 * Not specific to the user of the app but specific for the app as a whole
 */
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ENVIRONMENT = process.env.ENVIRONMENT;
const REDIRECT_URI = process.env.REDIRECT_URI;

class QBOConnection {
  oauthClient = null;
  authTokenObj = null;
  urlBase = '';
  companyID = '';

  constructor() {
    this.oauthClient = new OAuthClient({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      environment: ENVIRONMENT,
      redirectUri: REDIRECT_URI,
    });
  }

  getAuthUri() {
    const authUri = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.Payment],
      state: 'intuit-test',
    });
    return authUri;
  }

  handleIntuitOAuthCallback(requestUrl) {
    return this.oauthClient.createToken(requestUrl)
    .then((authResponse) => {
      this.companyID = this.oauthClient.getToken().realmId;
      this.urlBase = this.oauthClient.environment == 'sandbox' ? OAuthClient.environment.sandbox : OAuthClient.environment.production;
      this.authTokenObj = authResponse.getJson();
    })
    .catch((err) => {
      console.debug(err);
    });
  }

  getSalesReceiptByPaymentRef(paymentRefNum) {
    const query = `select * from SalesReceipt where PaymentRefNum='${paymentRefNum}'`;
    return this.oauthClient.makeApiCall({
      url: `${this.urlBase}v3/company/${this.companyID}/query?query=${query}`
    })
    .then((queryResponse) => {
      const queryResponseJson = queryResponse.getJson();
      return queryResponseJson.QueryResponse;
    })
    .catch(err => {
      console.debug(err);
      return {};
    })
  }

  getCompanyInfo() {
    return this.oauthClient.makeApiCall({ 
      url: `${this.urlBase}v3/company/${this.companyID}/companyinfo/${this.companyID}` 
    })
    .then((authResponse) => {
      return JSON.parse(authResponse.text());
    })
    .catch(function (e) {
      console.error(e);
    });
  }

  createSalesReceipt(amount, description, date, stripeId, email, customerName) {
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

    return this.oauthClient.makeApiCall({ 
      url: `${this.urlBase}v3/company/${this.companyID}/salesreceipt`,
      method: 'POST',
      body: receipt 
    })
    .then(createSalesReceiptResponse => {
      return createSalesReceiptResponse;
    })
    .catch(err => {
      console.debug(err);
      return {};
    });
  }

  refreshAccessToken() {
    return this.oauthClient.refresh()
    .then(authResponse => {
      this.authTokenObj = authResponse.getJson();
      return this.authTokenObj;
    })
    .catch(function (e) {
      console.error(e);
      return null;
    });
  }

  getDisconnectUri() {
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.OpenId, OAuthClient.scopes.Email],
      state: 'intuit-test',
    });
  }

  printState() {
    console.debug(this.qbo);
    console.debug(this.oauthClient);
    console.debug(this.authTokenObj);
    console.debug(this.companyID);
    console.debug(this.urlBase);
  }
}

module.exports = QBOConnection;