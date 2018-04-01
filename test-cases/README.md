# spark emulator test
This directory includes tests that attempt to validate that the spark emulator's behavior matches the behavior of the actual Cisco Spark platform.

At the time of this writing there are only test cases to validate responses to the /messages API when markdown is provided as input, as these test cases were developed while the markdown functionality was added.  It is hoped that as other contributions are made to add additional functionality to the emulator, that new test cases will be added as well.

## Checklist (absolute bare minimum to run the tests)

Prerequisites:

The test cases make calls to both the "real" Cisco Spark platform as well as to a running instance of the emulator.   In order to call the Cisco Spark platform the tester must:

- [ ] Sign up for Cisco Spark (logged in with your web browser)
- [ ] Know the spark authentication token, person ID, display name, nickname and email associated with your spark user account
- [ ] Know the person ID, display name, nickname and email associated with one other Spark user

In addition to being able to call Spark, the tests will call a running instance of the emulator which requires:

- [ ] A running instance of the spark emulator and access to the tokens.json file that defines the valid users for the emulator

The tests were creating using Postman, a tool for making API calls available here:https://www.getpostman.com/.   The test cases were developed using tips from this blogpost: http://blog.getpostman.com/2017/07/28/api-testing-tips-from-a-postman-professional/

## Configuruing the Postman environment

Before running the tests, you must configure your environment with the details of your Spark Test users.  Make a copy of the file [spark_emulator_tests.postman_environment_starter.json](./spark_emulator_tests.postman_environment_starter.json), rename it spark_emulator_tests.postman_environment.json and open it with your favorite editor.  Alternately, you can import this file into postman and edit the environment there.  

This environment file defines the environment variables required for the tests.   The API_URL is pre-populated.  You must manually update the enivronment to specify the following environment variables below:
* API_URL -- The URL of the live Spark API
* spark_token -- A valid auth token for calling Spark
* tester_id -- the person ID of the holder of spark_token
* tester_display_name -- the display name of the holder of spark_token
* tester_nickname -- the nickname of the holder of the spark_token
* tester_email -- the email of the holder of the spark_token
* person2_id: -- the person ID of a second person that can be added to the spark room
* person2_email - the spark email for the second person
* person2_display_name - the second person's spark display name
* person2_nickname -- the second person's nickname

These variables for the emulator environment are pre-populated using the default values for this project and with values specified in [tokens.json](./tokens.json).   As you customize the spark-emulator for your enviroment you may also need to update these test enviroment variables as well.

* EMULATOR_URL - The URL of the Spark Emulator being tested
* emulator_token - The token of a user specified in the emulator's token.json file
* emulator_display_name - The display name associated with that user in token.json
* emulator_nickname - The nickname associated with that user in token.json
* emulator_id - The person ID associated with that user in token.json
* emulator_email - The email associated with that user in token.json
* emulator_person2_id The person ID of a second user defined in the emulator's token.json file
* emulator_person2_email: - The email associated with that user in token.json
* emulator_person2_display_name - The display name associated with that user in token.json
* emulator_person2_nickname - The nickname associated with that user in token.json

Once your copy of the environment variables are specified you can run the tests from the command line or load the provided test cases and postman environment into your Postman instance by choosing Import from the File Menu and import the two files [CiscoSparkMarkdownTests.postman_collection.json](./CiscoSparkMarkdownTests.postman_collection.json), and [spark_emulator_tests.postman_environment.json](./spark_emulator_tests.postman_environment.json).  

## Running the tests
The NPM commands in this section should be run from the spark-emulator project diretory.

To run the tests from the command line, you will need to have Postman's cli tool: newman installed.   If you do not have this install it as follows:
    
    npm install -g newman

Before running the tests, start the emulator:

    npm start

Finally, run the test cases:

    npm test

Alternately, you may choose to run the tests from within the Postman tool either manually, or using the Runner tool.    For this collection of test cases the order is important in general, the following methodology is used:
* First test creates a room in spark and defines many of the functions used by subsequent test cases.  *It is important that this test be run before any other tests are run.*   In postman view the Tests tab better understand what the test cases do
* The second test creates a room in the emulator
* After these, the test cases generally send a message to the Spark environment, save the results, and then send the same message (although with different user IDs when sending markdown that includes mentions), and compares the results.
* The final two tests delete the spaces in both the real Spark environment and in the emulator


When properly configured almost all test will pass with the following exceptions:
* The test that excersises a mention using the <@personId:[id]|[name]> syntax with an invalid ID fails.  On the real spark platform the invalid ID is replaced with some encoded version of the invalid ID while in the emulator the markdown and html include the ID that was passed in.  In addition the emulator will pass the invalid IDs back in the mentionedPeople array while Spark does not. It is expected that three out of the seven test cases will fail. 
* The test that excersises a mention using the <@personEmail:[email]|[name]> syntax fails.  As of this writing performing functions such as adding users to spaces via email, or mentioning users via email is not supported in the emulator.   It is expected that four out of the seven test will fail.

When running the tests from the command line succesful output will be:
┌─────────────────────────┬──────────┬──────────┐
│                         │ executed │   failed │
├─────────────────────────┼──────────┼──────────┤
│              iterations │        1 │        0 │
├─────────────────────────┼──────────┼──────────┤
│                requests │       22 │        0 │
├─────────────────────────┼──────────┼──────────┤
│            test-scripts │       22 │        0 │
├─────────────────────────┼──────────┼──────────┤
│      prerequest-scripts │        0 │        0 │
├─────────────────────────┼──────────┼──────────┤
│              assertions │       85 │        7 │
├─────────────────────────┴──────────┴──────────┤



- [ ] Turn on your bot server with ```npm start```
