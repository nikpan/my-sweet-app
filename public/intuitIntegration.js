document.getElementById('authorizeIntuit').addEventListener('click', function response(e) {
  e.preventDefault();
  authorizeIntuit();
});

function authorizeIntuit() {
  var jsonBody = {};

  $.get('/qboAuthUri', {json:jsonBody}, function (uri) {
      console.log('The Auth Uris is :'+uri);
  })
  .then(function (authUri) {
      // Launch Popup using the JS window Object
      var parameters = "location=1,width=800,height=650";
      parameters += ",left=" + (screen.width - 800) / 2 + ",top=" + (screen.height - 650) / 2;
      var win = window.open(authUri, 'connectPopup', parameters);
      var pollOAuth = window.setInterval(function () {
          try {
              if (win.document.URL.indexOf("code") != -1) {
                  window.clearInterval(pollOAuth);
                  win.close();
                  getCompanyInfo();
              }
          } catch (e) {
              console.log(e)
          }
      }, 100);
  });
}

document.getElementById('getCompanyInfo').addEventListener('click', function response(e) {
  e.preventDefault();
  getCompanyInfo();
});

var companyInfo = null;

function getCompanyInfo() {
  $.get('/getCompanyInfo', function (response) {
    companyInfo = {
      CompanyName: response.CompanyInfo.CompanyName,
      Id: response.CompanyInfo.Id
    }
    $("#intuitCompanyInfo").html(JSON.stringify(companyInfo, null, 4));
    console.debug(companyInfo);
  });
}

document.getElementById('refreshToken').addEventListener('click', function response(e) {
  e.preventDefault();
  refreshToken();
});

function refreshToken() {
  $.get('/refreshAccessToken', function (token) {
      var token = (token!=null) ? token : 'Please Authorize Using Connect to Quickbooks first !';
      $("#accessToken").html(token);
  });
}