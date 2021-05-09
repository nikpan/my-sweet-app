const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = function(app) {
  var connectedAccountId = '';
  
  /**
   * authStripe - 
   */
  app.get('/authStripe', function (req, res) {
    console.log('authStripe called');
    res.send('authStripe response');
  });

  /**
   * stripeCallback - callback from stripe OAuth
   */
  app.get('/stripeCallback', function (req, res) {
    console.log('stripeCallback called');
    stripe.oauth.token({
      grant_type: 'authorization_code',
      code: req.query.code
    }).then((response) => {
      connectedAccountId = response.stripe_user_id;
    }).catch(err => {
      console.debug(err);
    });
    res.send('stripeCallback response');
  });
  
  /**
   * getStripeTransactions - get transactions from stripe account
   */
  app.get('/getStripeTransactions', function (req, res) {
    console.log('getStripeTransactions called');
    stripe.accounts.retrieve(connectedAccountId)
    .then(account => {
      const accountInfo = {
        id: account.id,
        displayName: account.settings.dashboard.display_name
      }
      return accountInfo;
    })
    .then(async (accountInfo) => {
      var customers = await stripe.customers.list({
        limit: 10
      }, {
        stripeAccount: accountInfo.id
      });
      var charges = await stripe.charges.list({}, {
        stripeAccount: accountInfo.id
      });
      return {
        customers,
        charges
      };
    })
    .then((customersAndCharges) => {
      var chargeList = [];
      var customers = customersAndCharges.customers.data;
      storeCustomers(customers);
      var charges = customersAndCharges.charges.data;
      charges.forEach(charge => {
        var customer = getCustomerById(charge.customer);
        chargeList.push({
          id: charge.id,
          amount: charge.amount,
          description: charge.description,
          createdTime: charge.created,
          paymentMethod: charge.payment_method_details.type,
          cardType: charge.payment_method_details.card.brand,
          customerEmail: customer.email,
          customerName: customer.name
        });
      });
      res.send({list: chargeList});
    })
    .catch(err => {
      console.debug(err);
    })
  });
  
  /**
   * disconnectStripe - disconnect stripe account and delete connected account data
   */
  app.get('/disconnectStripe', function (req, res) {
    console.log('disconnectStripe called');
    connectedAccountId = '';
    res.send('disconnectStripe response');
  });
}

let customers = [];

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