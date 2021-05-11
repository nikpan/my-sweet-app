
Intuit + Stripe OAuth2.0 Craft Demo Problem - NodeJS
==========================================================

## Overview

This is a POC app built using Node.js and Express Framework to showcase Intuit + Stripe integration. 
The app allows users to connect to their Intuit QuickBooks Company account using [Intuit's OAuth2.0 Client library](https://developer.intuit.com/app/developer/qbpayments/docs/develop/authentication-and-authorization/oauth-2.0).
Users can connect to their Stripe Account using [Stripe's OAuth connect flow](https://stripe.com/docs/connect/oauth-reference).
After connecting the two accounts users can import sales transactions from Stripe, review them in the Web App, and export to Intuit's QBO as Sales Receipts. The app also recognizes charges that are already synced to prevent exporting duplicate transactions. 

## Installation

### Requirements

* [Node.js](http://nodejs.org) >= 7.0.0
* [Intuit Developer](https://developer.intuit.com) Account
* [Stripe Developer](https://stripe.com/docs/development) Account

### Via Github Repo (Recommended)

```bash
$ cd sample
$ npm install
```

## Configuration

Copy the contents from `.env.example` to `.env` within the sample directory:
```bash
$ cp .env.example .env
```
Edit the `.env` file to add your:  

* **CLIENT_ID:(required)** Client ID key for the Intuit Developer Account
* **CLIENT_SECRET:(required)** Client Secret key for the Intuit Developer Account
* **STRIPE_PUBLISHABLE_KEY:(required)** Publishable Key for the Stripe Developer Account 
* **STRIPE_SECRET_KEY:(required)** Secret Key for the Stripe Developer Account
* **ENVIRONMENT:(required)** Environment for the Intuit Company; Set to `sandbox`
* **REDIRECT_URI:(required)** Redirect Uri for Intuit OAuth Callback
* **PORT:(optional)** Optional port number for the app to be served

## Usage

```bash
$ npm run start
```

You will see an URL as below:
```bash
Server listening on port 8000
Paste this URL in your browser to access the app: http://localhost:8000
```

## Links

Project Repo

* https://github.com/intuit/oauth-jsclient

Intuit OAuth2.0 API Reference

* https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0

Intuit OAuth2.0 Playground

* https://developer.intuit.com/app/developer/playground

## Contributions

Any reports of problems, comments or suggestions are most welcome.

Please report these on [Issue Tracker in Github](https://github.com/intuit/oauth-jsclient/issues).


[ss1]: https://help.developer.intuit.com/s/samplefeedback?cid=9010&repoName=Intuit-OAuth2.0-Sample-NodeJS