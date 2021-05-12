process.env.NODE_ENV = 'test';
var app = require('../../app');
var Browser = require('zombie');
var assert = require('assert');

before(function() {
  this.server = app.listen(3000);
  this.browser = new Browser({site: 'http://localhost:3000'});
})

describe('/getStripeCompanyInfo', function() {
  before(function(done) {
    this.browser.visit('/getStripeCompanyInfo', done);
  });

  it('if not connected should return empty JSON', function() {
    assert.ok(this.browser.success);
    assert.notStrictEqual(this.browser.html(), '{}');
  });
});

describe('/', function() {
  before(function(done) {
    this.browser.visit('/', done);
  });

  it('should return home page', function() {
    assert.ok(this.browser.success);
  });
});