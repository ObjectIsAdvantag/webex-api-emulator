//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//


const assert = require("assert");
const uuid = require('uuid/v4');
const base64 = require('base-64');
const removeMd = require('remove-markdown');
const showdown = require('showdown');
const converter = new showdown.Converter();

const debug = require("debug")("emulator:storage:messages");


function MessageStorage(datastore) {
    this.datastore = datastore;
    this.data = {};
}

MessageStorage.prototype.createInRoom = function (actor, room, text, markdown, file, attachments, cb) {

    assert.ok(actor);
    assert.ok(room);
    assert.ok(text || markdown || file);

    // Create message
    const now = new Date(Date.now()).toISOString();
    var message = {
        "id": base64.encode("ciscospark://em/MESSAGE/" + uuid()),
        "roomId": room.id,
        "roomType": room.type
    }

    message.text = (text) ? text : removeMd(markdown)

    // Append attachments
    if (attachments) {
        message.attachments = attachments;
    }

    // Store message
    message.personId = actor.id;
    message.personEmail = actor.emails[0];

    // Append markdown properties
    if (markdown) {

        // Check if there are mentions in the markdown
        // If so replace the mention markup with the mention name     
        // And add a mentionedPeople array
        let mentionInfo = _buildMentionedPeopleArray(markdown);
        if (mentionInfo.mentionedPeople.length) {
            message.mentionedPeople = mentionInfo.mentionedPeople;
            message.markdown = mentionInfo.newMarkdown;
            message.text = removeMd(mentionInfo.newText);
        }
        else {
            message.markdown = markdown;
        }

        // build html from markdown 
        message.html = converter.makeHtml(markdown);
    }

    message.created = now;
    this.data[message.id] = message;

    if (cb) {
        cb(null, message);
    }

    // Emit event
    this.datastore.bus.emit('messages/created', actor, message);
}


MessageStorage.prototype.listAllInRoom = function (actor, roomId, cb) {

    assert.ok(actor);
    assert.ok(roomId);

    // List messages for room, order by created date DESC
    const self = this;
    var messages = [];
    Object.keys(this.data).forEach(function (key) {
        let message = self.data[key];
        if (message.roomId == roomId) {
            messages.push(message);
        }
    });

    messages.sort(function (a, b) {
        return (a.created < b.created);
    });

    if (cb) {
        return cb(null, messages);
    }
}


MessageStorage.prototype.find = function (actor, messageId, cb) {

    assert.ok(actor);
    assert.ok(messageId);

    // Check message exists
    const message = this.data[messageId];
    if (!message) {
        debug("message not found: ${messageId}");
        if (cb) {
            var err = new Error("message not found");
            err.code = "MESSAGE_NOT_FOUND";
            cb(err, null);
        }
        return;
    }

    // Check the user is part of the room
    this.datastore.rooms.find(actor, message.roomId, function (err, room) {
        if (err) {
            debug("forwarding error: ${err.message}");
            if (cb) {
                cb(err, null);
            }
            return;
        }

        // User is part of the room, and mesage found, let's return
        if (cb) {
            cb(null, message);
        }
    });
}


module.exports = MessageStorage;


//
// Local utility functions
//

function _buildMentionedPeopleArray(markdown) {
    let mentionInfo = {
        mentionedPeople: [],
        newMarkdown: markdown,
        newText: markdown
    };

    // If mention by personId, extract out the mentioned personId and Name
    //TODO - fix this regex so it works with multiple mentions.
    re = new RegExp("<@personId:(.*?)>", 'g')
    let match = re.exec(markdown);
    if (match) {

        // [PENDING] From JP: After many hours trying and reading stackoverflow I just can't
        // figure out how to write a "non greedy" regex that doesn't take just
        // the last mention.  For example if the payload is this:
        // <@personId:Y2lz...A|JP>, <@personId:Y2l...g|The Bot I'm Testing>, This is a mention for JP and the bot"
        // The matcher will eat the first person and return only the personId and name of the last user mentioned
        let personId = match[1].trim();
        let isEmptyDisplayName = false;
        if (personId.endsWith("|")) {
            personId = personId.substring(0, personId.length() - 1);
            isEmptyDisplayName = true;
        }
        if (personId.includes("|")) {
            let mentionId = personId.substring(0, personId.indexOf("|"));
            let mentionName = personId.substring(personId.indexOf("|") + 1);
            mentionInfo.newMarkdown = _addDisplayNameForMentions(mentionInfo.newMarkdown,
                null, mentionId, mentionName, true, isEmptyDisplayName);
            mentionInfo.mentionedPeople.push(personId.substring(0, personId.indexOf("|")));
            mentionInfo.newText = mentionInfo.newText.replace(match[0], mentionName);
        } else {
            //TODO Handle cases when the API call does not specify a name
            inputMessage = _addDisplayNameForMentions(inputMessage, null, personId,
                getDisplayName(personId), false, isEmptyDisplayName);
            mentionInfo.mentionedPeople.push(personId);
        }

        return mentionInfo;
    }

    // If mention by personEmail, extract out the mentioned personEmail and Name
    re = new RegExp("<@personEmail:(.*?)>", 'g')
    match = re.exec(markdown);
    if (match) {
        // [TODO]
        debug("WARNING: mentioning by person email is not supported by the emulator")

        return mentionInfo;
    }

    // No mentions
    return mentionInfo;
}

function _addDisplayNameForMentions(inputMessage, personEmail, personId, displayName, displayNameProvided, isEmptyDisplayName) {

    const HREF_PATTERN_STRING = "<a href=\"%s\">";
    const GROUP_MENTION_OUTPUT_PATTERN = "<spark-mention data-object-type=\"groupMention\" data-object-id=\"%s\">%s</spark-mention>";
    const OUTPUT_MENTION_PATTERN = "<spark-mention data-object-type=\"person\" data-object-id=\"%s\">";

    // TODO Index into tokens.json to see if the ID is asscoiated with a person or a bot (or even exists!)
    // For now we'll just assume its a person
    //String decodedPersonId = ResourceUtility.getStringFromBase64Id(personId, ResourceUtility.ResourceType.PEOPLE);
    //String outputMessage = String.format(HydraMarkdownProperties.OUTPUT_PATTERN, decodedPersonId, displayName);
    let outputMessage = _printf("<spark-mention data-object-type=\"person\" data-object-id=\"%s\">%s</spark-mention>", personId, displayName);
    let inputMention = ''
    if (personEmail == null) {
        if (displayNameProvided) {
            inputMention = _printf("<@personId:%s|%s>", personId, displayName);
        } else {
            if (isEmptyDisplayName) {
                inputMention = _printf("<@personId:%s|%s>", personId, '');
            } else {
                inputMention = _printf("<@personId:%s>", personId);
            }
        }
        return inputMessage.replace(inputMention, outputMessage);
    } else {
        if (displayNameProvided) {
            inputMention = _printf("<@personEmail:%s|%s>", personEmail, displayName);
        } else {
            if (isEmptyDisaplayName) {
                inputMention = _printf("<@personEmail:%s|%s>", personEmail, '');
            } else {
                inputMention = _printf("<@personEmail:%s>", personEmail);
            }
        }
        return inputMessage.replace(inputMention, outputMessage);
    }
}


// Support java like sprintf capabilities
// Works for strings only
function _printf(str, obj) {
    var useArguments = false;
    var _arguments = arguments;
    var i = 0;
    if (typeof _arguments[1] == "string") {
        useArguments = true;
    }
    if (obj instanceof Array || useArguments) {
        return str.replace(/\%s/g,
            function (a, b) {
                i++;
                if (useArguments) {
                    if (typeof _arguments[i] == 'string') {
                        return _arguments[i];
                    }
                    else {
                        throw new Error("Arguments element is an invalid type");
                    }
                }
                return obj[i];
            });
    }
    else {
        return str.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = obj[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            });
    }
};