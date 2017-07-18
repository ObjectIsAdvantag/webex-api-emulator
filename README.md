# Emulator for Cisco Spark REST API

The emulator 

The primary goal of the emulator is to provide a safe place to test bots.

Therefore, the emulator mimics Cisco Spark REST API behavior for /rooms, /messages, /memberships and /webhooks resources, 
and allows you to create bot accounts dynamically.

The following features are not implemented: Room moderation, Teams, Pagination, Filtering, Activity Status, Automatic Invitations (if non Spark users are added to rooms).


## Quickstart

- [Optional] update file 'tokens.json' with the tokens you want the API to accept. Generally, you'll want your name, email and organisation id to be displayed in there. You can put random values in there, or pick the real value as stored in Cisco Spark by hitting the /people/me of the Cisco Spark API

- 