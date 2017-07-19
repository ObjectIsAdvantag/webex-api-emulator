# Emulator for Cisco Spark REST API


The primary goal of the emulator is to tests Cisco Spark chat bots.

Therefore, the emulator mimics Cisco Spark REST API behavior for /rooms, /messages, /memberships and /webhooks resources, 
and also allows you to inject User and Bots counts.

The following features are NOT implemented: Messages Attachements, Room moderation, People LastActivity & Status and Pagination, as well as Teams, Automatic Invitations (if non Spark users are added to rooms) and Administration APIs, 


## Quickstart

- [Optional] update file 'tokens.json' with the tokens you want the API to accept. Generally, you'll want your name, email and organisation id to be displayed in there. You can put random values in there, or pick the real value as stored in Cisco Spark by hitting the /people/me of the Cisco Spark API

- Invoke the API with one of the tokens listed in 'tokens.json'
   - GET  /people/me           shows spark account details
   - POST /rooms               create a new room
   - POST /rooms               create another room
   - GET  /rooms               shows your rooms (2)
   - POST /memberships         add a bot to the room
   - POST /memberships         409 (conflict)
   - GET  /memberships         show all your memberships
   - GET  /memberships?room=   fetch memberships for you and your bot in current room
   - POST /messages

