# a local emulator for Webex REST API

_Disclaimer: This is not an official Cisco product._

**Table of Contents**

* [What is the Webex API Emulator?](#what-is-the-webex-api-emulator)
* [Try it live](#try-it-live)
* [Run it locally](#run-it-locally)
* [Get the Postman collection](#get-the-postman-collection)
* [License](./LICENSE)


## What is the Webex API Emulator?

The primary use case of this emulator is to test and debug Webex chat bots.

The emulator mimics some of the Webex REST API resources: /rooms, /memberships, /messages, /attachment/actions and /webhooks.

The following features are NOT implemented: File Attachements, Room moderation, People LastActivity & Status, Teams, Automatic Invitations (if non Webex users are added to spaces), Administration APIs (/licenses, /roles, /organizations, /devices, /places) and pagination.

The emulator can be used for several purposes:
- testing: on a developer laptop machine or on a CI environment to run a battery of tests with no connection to Webex. Note that 429 (Rate Limitations) won't be raised by the emulator.
- QA: run your code against a stable version of Webex (as the Cloud Service is incrementally upgraded, some bugs can be hard to replay. The emulator complies with a version of the API at a specific date, and helps reproduce an issue, or test for an upcoming feature (not released yet or toggled on)
- Training: backup plan in case of low or no connectivity location
- QA: simulate specific behaviors or errors from Webex (429, 500, 503)


## Run it locally

Install and run the emulator on your local machine (starts on port 3210 by default)

```shell
git clone https://github.com/ObjectIsAdvantag/webex-api-emulator
cd webex-api-emulator
npm install
DEBUG="emulator*" node server.js
```

The emulator loads with a [static list](./tokens.json) of Webex User and Bot accounts.

    [Optional] update file 'tokens.json' with some fake access tokens you want the emulator to accept. 
    **DO NOT USE FILL IN REAL WEBEX ACCESS TOKENS**
    Generally, you'll want to put in your name, email and organisation identifiers as well as your bot's account information. 

All set! 
Now invoke some of the Webex REST API Resources on default port http://localhost:3210, with token listed in your 'tokens.json' configuration file.

   - GET  /people/me           shows your Webex account details
   - POST /rooms               create a new room
   - POST /rooms               create another room
   - GET  /rooms               shows your rooms (2)
   - POST /memberships         add a bot to the room
   - POST /memberships         409 (conflict)
   - GET  /memberships         show all your memberships
   - GET  /memberships?room=   fetch memberships for you and your bot in current room
   - POST /messages            create a new message
   - POST /webhooks            register a new webhook pointing to a target URL on your local machine, or on the internet


## Get the Postman collection

The emulator comes with a Postman collection companion to quickly run requests againt the Emulator, and easilly switch back and forth between the emulator and the Webex REST API. 

To install the postman collection:
- import the collection into Postman by [clicking this link](https://www.getpostman.com/collections/c76412ea237207555b57), or with the "import collection" feature 
- create a new Postman environment, and from the INIT folder, run the "load env variables (localhost)" to initialize your environment
- you are good to go, use the requests folders and interact with the emulator

### Detailed steps to initiatilize your postman environment

After loading the postman collection, create a new environment with 4 variables: endpoint, user_token, bot_token, bot_email
    - endpoint: http://127.0.0.1:3210 (in place of https://api.ciscospark.com/v1)
    - user_token: the access token of a Webex User
    - bot_token: the access token of a Webex Bot account
    - bot_email: the email of the bot (for the user to invite it)

Note that values for `user_token`, `bot_token` and `bot_email` must be part of your emulator's [tokens configuration](./tokens.json) file


## Try it live

The emulator is accessible at "https://miniwebex.herokuapp.com". 

_Note that the emulator is deployed as Heroku free dynos: leave it up to 30 seconds to wake up._

To give it a try, you'll need an access token.
You can pick a user or bot token from the map proposed at "https://miniwebex.herokuapp.com/tokens". The entry in the map corresponds to the token of the user.

Congrats, you're now ready to make a [REST API call](https://developer.webex.com/getting-started.html) to the 'Mini-Webex' root endpoint.

```
curl -s -H "Authorization: Bearer 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" -X GET https://miniwebex.herokuapp.com/people/me
```

Check instructions below to load a postman collection with the supported API calls.
