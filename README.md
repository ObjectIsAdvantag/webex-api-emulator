# Emulator for Cisco Spark REST API

The primary goal of the emulator is to build Cisco Spark chat bots.
Therefore, the emulator mimics Cisco Spark REST API behavior for /rooms, /messages, /memberships and /webhooks resources.

The following features are NOT implemented: Messages Attachements, Room moderation, People LastActivity & Status and Pagination, as well as Teams, Automatic Invitations (if non Spark users are added to rooms) and Administration APIs, 

The emulator can be used for several purposes:
- testing: on a developer laptop machine or on a CI environment to run a battery of test with no connection to Cisco Spark, and without 409 (Rate Limitations),
- QA: run your code against a stable version of Cisco Spark (as the Cloud Service is incrementally upgraded, some bugs can be hard to replay. The emulator complies with a version of the API at a specific date, and helps reproduce an issue, or test for an upcoming feature (not released yet or toggled on)
- Training: backup plan in case of low or no connectivity location
- QA: simulate specific behaviors or errors from CiscoSpark (429, 500, 503)


## Quickstart

- The emulator comes with a [Postman collection](https://www.getpostman.com/collections/c76412ea237207555b57) companion to quickly run requests against both the Cisco Spark and Emulator APIs.

    - Import the collection into Postman, and setup an environment with 4 variables: endpoint, spark_token, bot_token, bot_email
       - endpoint: http://127.0.0.1:3210 (in place of https://api.ciscospark.com/v1)
    

- The emulator launches with a static list of Spark User and Bots accounts.

    [Optional] update file 'tokens.json' with the tokens you want the API to accept. Generally, you'll want your name, email and organisation id to be displayed in there. You can put random values in there, or pick the real value as stored in Cisco Spark by hitting the /people/me of the Cisco Spark API


- Invoke Cisco Spark API Resources on default port http://localhost:3210, with a user of bot token from 'tokens.json'
   - GET  /people/me           shows spark account details
   - POST /rooms               create a new room
   - POST /rooms               create another room
   - GET  /rooms               shows your rooms (2)
   - POST /memberships         add a bot to the room
   - POST /memberships         409 (conflict)
   - GET  /memberships         show all your memberships
   - GET  /memberships?room=   fetch memberships for you and your bot in current room
   - POST /messages
