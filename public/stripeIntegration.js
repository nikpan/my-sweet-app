document.getElementById('authorizeStripe').addEventListener('click', function response(e) {
  e.preventDefault();
  authorizeStripe();
});

document.getElementById('getStripeTransactions').addEventListener('click', function response(e) {
  e.preventDefault();
  getStripeTransactions();
});

document.getElementById('disconnectStripe').addEventListener('click', function response(e) {
  e.preventDefault();
  disconnectStripe();
});

function authorizeStripe() {
  stripeAuthUri = 'https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_JOxqdAa5BkPVbvVrVz2psEjLmfHqm4wy&scope=read_only'
  var parameters = "location=1,width=800,height=650";
  parameters += ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;
  var win = window.open(stripeAuthUri, 'connectPopup', parameters);
  var pollOAuth = window.setInterval(function () {
      try {
          if (win.document.URL.indexOf("code") != -1) {
              window.clearInterval(pollOAuth);
              win.close();
              location.reload();
          }
      } catch (e) {
          console.log(e);
      }
  }, 100);
}

function getStripeTransactions() {
  $.get('/getStripeTransactions', function (response) {
      var charges = response.list;
      var tableDom = document.createElement('table');
      tableDom.append(getHeaderRow(charges[0]));
      charges.forEach(charge => {
        charge.createdTime = new Date(charge.createdTime*1000)
        tableDom.append(getStripeTransactionRow(charge));
      });
      $("#stripeTransactions").append(tableDom);
      $("#stripeApiCall").html(JSON.stringify(response, null, 4));
  });
}

function disconnectStripe() {
  $.get('/disconnectStripe', function (response) {
      console.debug(response);
  });
}

function getStripeTransactionRow(transaction) {
  var row = document.createElement('tr');
  row.classList.add('transactionRow');
  for (const key in transaction) {
      var field = document.createElement('td');
      field.classList.add('transactionCell');
      field.innerText = transaction[key];
      row.append(field);
  }
  var actionButtonCell = document.createElement('td');
  actionButtonCell.classList.add('transactionCell');
  actionButtonCell.append(createSendTransactionButton(transaction));
  row.append(actionButtonCell);
  return row;
}

function getHeaderRow(transaction) {
  var row = document.createElement('tr');
  row.classList.add('transactionRow');
  row.classList.add('transactionHeader');
  for (const key in transaction) {
      var field = document.createElement('td');
      field.classList.add('transactionCell');
      field.innerText = key;
      row.append(field);
  }
  var actionButtonHeader = document.createElement('td');
  actionButtonHeader.classList.add('transactionCell');
  actionButtonHeader.innerText = 'action';
  row.append(actionButtonHeader);
  return row;
}

function createSendTransactionButton(transaction) {
  var pushTransactionButton = document.createElement('button');
  pushTransactionButton.innerText = 'Send To QBO';
  pushTransactionButton.className = "btn btn-success";
  pushTransactionButton.addEventListener('click', function(e) {
    e.preventDefault();
    sendTransactionsToQbo(transaction);
  });
  return pushTransactionButton;
}

function sendTransactionsToQbo(transaction) {
  $.ajax('/createSalesReceipt', {
    data: JSON.stringify(transaction),
    contentType: 'application/json',
    type: 'POST'
  }, function (response) {
    console.debug(response);
  })
}