const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

class StripeConnection {
  connectedAccountUserId = '';
  connectedAccountName = '';
  connectedAccountInfo = '';
  constructor() {

  }

  getAuthUri() {
    const scope = 'read_only';
    const responseType = 'code';
    const clientId = process.env.STRIPE_CLIENT_ID;
    const authUri = `https://connect.stripe.com/oauth/authorize?response_type=${responseType}&client_id=${clientId}&scope=${scope}`;
    return authUri;
  }

  handleStripeOAuthCallback(code) {
    return stripe.oauth.token({
      grant_type: 'authorization_code',
      code: code
    }).then((response) => {
      this.connectedAccountUserId = response.stripe_user_id;
    })
    .then(() => {
      return stripe.accounts.retrieve(this.connectedAccountUserId);
    })
    .then((account) => {
      this.connectedAccountInfo = {
        id: account.id,
        displayName: account.settings.dashboard.display_name
      }
    })
    .catch(err => {
      console.debug(err);
    });
  }

  getCompanyInfo() {
    if(this.connectedAccountUserId == '') {
      console.debug('No Stripe Account connected');
      return {};
    } 
    if(this.connectedAccountInfo == '') {
      console.debug('Account Info not yet synced');
      return {};
    }
    return stripe.accounts.retrieve(this.connectedAccountInfo.id)
    .then((accountInfo) => {
      return accountInfo;
    })
    .catch(function (e) {
      console.debug(e);
      return {};
    });
  }

  getStripeCustomers() {
    if(this.connectedAccountUserId == '') {
      console.debug('No Stripe Account connected');
      return [];
    } 
    if(this.connectedAccountInfo == '') {
      console.debug('Account Info not yet synced');
      return [];
    }
    return stripe.customers.list({ limit: 10 }, { stripeAccount: this.connectedAccountInfo.id })
    .then(customers => {
      return customers.data;
    })
    .catch(err => {
      console.debug(err);
      return [];
    });
  }

  getStripeTransactions() {
    if(this.connectedAccountUserId == '') {
      console.debug('No Stripe Account connected');
      return [];
    } 
    if(this.connectedAccountInfo == '') {
      console.debug('Account Info not yet synced');
      return [];
    }
    return stripe.charges.list({}, {
      stripeAccount: this.connectedAccountInfo.id
    })
    .then(charges => {
      console.debug(charges);
      var chargeList = [];
      charges.data.forEach(charge => {
        chargeList.push({
          id: charge.id,
          amount: charge.amount,
          description: charge.description,
          createdTime: charge.created,
          paymentMethod: charge.payment_method_details.type,
          cardType: charge.payment_method_details.card.brand,
          customerId: charge.customer,
        });
      });
      return chargeList;
    })
    .catch(err => {
      console.debug(err);
      return [];
    });
  }

  printState() {
    console.debug(this.connectedAccountUserId);
    console.debug(this.connectedAccountName);
    console.debug(this.connectedAccountInfo);
  }

}

module.exports = StripeConnection;