# mini-spark: an Emulator for Cisco Spark REST API

The primary goal of the emulator is to build Cisco Spark chat bots.
Therefore, the emulator mimics Cisco Spark REST API behavior for /rooms, /messages, /memberships and /webhooks resources.

The following features are NOT implemented: Messages Attachements, Room moderation, People LastActivity & Status and Pagination, as well as Teams, Automatic Invitations (if non Spark users are added to rooms) and Administration APIs, 

The emulator can be used for several purposes:
- testing: on a developer laptop machine or on a CI environment to run a battery of test with no connection to Cisco Spark, and without 409 (Rate Limitations),
- QA: run your code against a stable version of Cisco Spark (as the Cloud Service is incrementally upgraded, some bugs can be hard to replay. The emulator complies with a version of the API at a specific date, and helps reproduce an issue, or test for an upcoming feature (not released yet or toggled on)
- Training: backup plan in case of low or no connectivity location
- QA: simulate specific behaviors or errors from CiscoSpark (429, 500, 503)


## Give it a try from Heroku

The emulator is accessible at "https://mini-spark.herokuapp.com" via Heroku free dynos.

To give it a try to the emulator, pick a user and bot token from the list available at https://mini-spark.herokuapp.com/tokens".

_when hitting the API, leave it up to 30 seconds to wake up_

Make standard Cisco Spark API calls, simply point to https://mini-spark.herokuapp.com.

Check instructions below to load a postman collection with the supported API calls.


## Quickstart

- Install and run the emulator on your local machine (starts on port 3210 by default)

```shell
git clone https://github.com/ObjectIsAdvantag/spark-emulator
cd spark-emulator
npm install
DEBUG="emulator*" node server.js
```


- The emulator loads with a [static list](tokens.json) of Cisco Spark User and Bots accounts.

    [Optional] update file 'tokens.json' with some fake access tokens you want the emulator to accept. 
    DO NOT USE FILL IN REAL SPARK ACCESS TOKENS.
    Generally, you'll want to put in your name, email and organisation identifiers as well as your bot's information. 
    

- Invoke Cisco Spark API Resources on default port http://localhost:3210, with a user of bot token from 'tokens.json'

   - GET  /people/me           shows spark account details
   - POST /rooms               create a new room
   - POST /rooms               create another room
   - GET  /rooms               shows your rooms (2)
   - POST /memberships         add a bot to the room
   - POST /memberships         409 (conflict)
   - GET  /memberships         show all your memberships
   - GET  /memberships?room=   fetch memberships for you and your bot in current room
   - POST /messages            create a new message
   - POST /webhooks            register a new webhook pointing to a target URL on your local machine, or on the internet


- The emulator comes with a Postman collection companion to quickly run requests againt the Emulator, and easilly switch back and forth between the emulator and the Cisco Spark API. To install the postman collection:

    - Import the collection into Postman by [clicking this link](https://www.getpostman.com/collections/c76412ea237207555b57), or with the "import collection" feature
    
    - setup an environment with 4 variables: endpoint, spark_token, bot_token, bot_email
       - endpoint: http://127.0.0.1:3210 (in place of https://api.ciscospark.com/v1)
       - spark_token: the access token of a Cisco Spark Human user
       - bot_token: the access token of a Cisco Spark Bot account
       - bot_email: the email of the bot (for the user to invite it)

    Note that values for `spark_token`, `bot_token` and `bot_email` must be part of the tokens.json file
