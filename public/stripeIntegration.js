document.getElementById('authorizeStripe').addEventListener('click', function response(e) {
  e.preventDefault();
  authorizeStripe();
});

document.getElementById('getStripeTransactions').addEventListener('click', function response(e) {
  e.preventDefault();
  getStripeTransactions();
});

// document.getElementById('disconnectStripe').addEventListener('click', function response(e) {
//   e.preventDefault();
//   disconnectStripe();
// });

function authorizeStripe() {
  var jsonBody = {};
  
  $.get('/stripeAuthUri', {json:jsonBody}, function (uri) {
    console.log('The Auth Uris is :'+uri);
  })
  .then(function (stripeAuthUri) {
    var parameters = "location=1,width=800,height=650";
    parameters += ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;
    var win = window.open(stripeAuthUri, 'connectPopup', parameters);
    var pollOAuth = window.setInterval(function () {
        try {
            if (win.document.URL.indexOf("code") != -1) {
                window.clearInterval(pollOAuth);
                win.close();
                getStripeCompanyInfo();
            }
        } catch (e) {
            console.log(e);
        }
    }, 100);
  });
}

document.getElementById('getSCompanyInfo').addEventListener('click', function response(e) {
  e.preventDefault();
  getStripeCompanyInfo();
});

var stripeCompanyInfo = null;

function getStripeCompanyInfo() {
  $.get('/getStripeCompanyInfo', function (response) {
    stripeCompanyInfo = response;
    stripeCompanyInfo = {
      CompanyName: response.settings.dashboard.display_name,
      Id: response.id
    }
    $("#stripeCompanyInfo").html(JSON.stringify(stripeCompanyInfo, null, 4));
    console.debug(stripeCompanyInfo);
  });
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
      $("#stripeTransactions").empty();
      $("#stripeTransactions").append(tableDom);
      $("#stripeApiCall").html(JSON.stringify(response, null, 4));
  });
}

function disconnectStripe() {
  $.get('/stripeDisconnect', function (response) {
      console.debug(response);
  });
}

function getStripeTransactionRow(transaction) {
  let row = document.createElement('tr');
  row.classList.add('transactionRow');
  let synced = false;
  let salesReceiptId = '';
  for (const key in transaction) {
    if(key == 'qboSalesReceiptId') {
      synced = transaction[key] != -1;
      salesReceiptId = transaction[key];
      continue;
    }
    let field = document.createElement('td');
    field.classList.add('transactionCell');
    field.innerText = transaction[key];
    row.append(field);
  }
  let actionButtonCell = document.createElement('td');
  actionButtonCell.classList.add('transactionCell');
  synced ? actionButtonCell.innerText = `SYNCED - ${salesReceiptId}` : actionButtonCell.append(createSendTransactionButton(transaction));
  row.append(actionButtonCell);
  return row;
}

function getHeaderRow(transaction) {
  var row = document.createElement('tr');
  row.classList.add('transactionRow');
  row.classList.add('transactionHeader');
  for (const key in transaction) {
    if(key == 'qboSalesReceiptId') {
      continue;
    }
    var field = document.createElement('td');
    field.classList.add('transactionCell');
    field.innerText = key;
    row.append(field);
  }
  var actionButtonHeader = document.createElement('td');
  actionButtonHeader.classList.add('transactionCell');
  actionButtonHeader.innerText = 'action / qboSalesReceiptId';
  row.append(actionButtonHeader);
  return row;
}

function createSendTransactionButton(transaction) {
  var pushTransactionButton = document.createElement('button');
  pushTransactionButton.innerText = 'Send To QBO';
  pushTransactionButton.className = "btn btn-success";
  pushTransactionButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendTransactionsToQbo(transaction, pushTransactionButton.parentElement);
    pushTransactionButton.style.display = 'none';
    pushTransactionButton.parentElement.innerText = 'Syncing';
  });
  return pushTransactionButton;
}

function sendTransactionsToQbo(transaction, actionButtonCell) {
  $.post('/createSalesReceipt', transaction, (response) => {
    actionButtonCell.innerText = 'Synced';
    console.debug(response);
  })
}