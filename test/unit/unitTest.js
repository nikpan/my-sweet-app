const QBOConnection = require("../../src/qboConnector");
var assert = require('assert');

var qboConnection = new QBOConnection();

describe('getAuthUri', function() {
  var authUri = '';
  before(function(done) {
    authUri = qboConnection.getAuthUri();
    console.debug(authUri);
    done();
  })
  
  it('intuit auth uri should contain scope', function() {
    assert.strictEqual(authUri.indexOf('scope') !== -1, true);
  });

  it('intuit auth uri should contain scope', function() {
    assert.strictEqual(authUri.indexOf('scope') !== -1, true);
  });
});