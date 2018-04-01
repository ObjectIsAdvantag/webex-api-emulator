//
// Copyright (c) 2017 Cisco Systems
// Licensed under the MIT License 
//

// Lib for converting markdown to HTML
var showdown  = require('showdown');
// Custom extension for adding nofollow to anchor links
var anchorAttributes = {
    type: 'output',
    regex: /(<a.+<\/a>)/g,
    replace: (match, $1) => {
      return $1.replace('">', '" rel="nofollow">');
    }
  };
showdown.extension('anchorAttributes', anchorAttributes);  
showdown.setOption('noHeaderId', 'true');
showdown.setOption('omitExtraWLInCodeBlocks', 'true');


function MarkdownManipulator() {

    this.markdown2html = new showdown.Converter({ extensions: ['anchorAttributes'] });
    this.markdown2html.setOption('noHeaderId', 'true');
    this.markdown2html.setOption('omitExtraWLInCodeBlocks', 'true');
    
    this.INPUT_PERSONID_PATTERN_WITHOUT_DISPLAYNAME = "<@personId:%s>";
    this.INPUT_PERSONID_PATTERN_WITH_DISPLAYNAME = "<@personId:%s|%s>";
    this.INPUT_PERSONEMAIL_PATTERN_WITHOUT_DISPLAYNAME = "<@personEmail:%s>";
    this.INPUT_PERSONEMAIL_PATTERN_WITH_DISPLAYNAME = "<@personEmail:%s|%s>";

    this.HREF_PATTERN_STRING = "<a href=\"%s\">";
    this.OUTPUT_PATTERN = "<spark-mention data-object-type=\"person\" data-object-id=\"%s\">%s</spark-mention>";
    this.GROUP_MENTION_OUTPUT_PATTERN = "<spark-mention data-object-type=\"groupMention\" data-object-id=\"%s\">%s</spark-mention>";
    this.OUTPUT_MENTION_PATTERN = "<spark-mention data-object-type=\"person\" data-object-id=\"%s\">";
/*
    public static Pattern MENTIONS_PATTERN = Pattern.compile("<spark-mention data-object-type=\"person\" data-object-id=\\\"(.*?)\\\">");
    public static Pattern GROUP_MENTIONS_PATTERN = Pattern.compile("<spark-mention data-object-type=\"groupMention\" data-object-id=\\\"(.*?)\\\">");
    public static Pattern PERSON_ID_PATTERN = Pattern.compile("<@personId:(.*?)>");
    public static Pattern PERSON_EMAIL_PATTERN = Pattern.compile("<@personEmail:(.*?)>");
    public static Pattern HREF_PATTERN = Pattern.compile("<a href=\"(.*?)\">");
    public static Pattern GROUP_MENTIONS_ALL_PATTERN = Pattern.compile("<@all>", Pattern.CASE_INSENSITIVE);
    public static Pattern GROUP_MENTIONS_HERE_PATTERN = Pattern.compile("<@here>", Pattern.CASE_INSENSITIVE);
*/
}

MarkdownManipulator.prototype.buildMentionedPeopleArray = function (markdown) {
    let mentionInfo = {
        mentionedPeople: [],
        newMarkdown: markdown,
        newText: markdown
    };
    //TODO -- check for mentioned people by personEmail
    // Extract out the mentioned personId and Name
    re = new RegExp("<@personId:(.*?)>", 'g')
    //TODO - fix this regex so it works with multiple mentions.
    // After many hours trying and reading stackoverflow I just can't
    // figure out how to write a "non greedy" regex that doesn't take just
    // the last mention.  For example if the payload is this:
    // <@personId:Y2lz...A|JP>, <@personId:Y2l...g|The Bot I'm Testing>, This is a mention for JP and the bot"
    // The matcher will eat the first person and return only the personId and name of the last user mentioned
    while((match = re.exec(markdown)) != null) {
        let personId = match[1].trim();
        let isEmptyDisplayName = false;
        if (personId.endsWith("|")) {
            personId = personId.substring(0, personId.length() - 1);
            isEmptyDisplayName = true;
        }
        if (personId.includes("|")) {
            let mentionId = personId.substring(0, personId.indexOf("|"));
            let mentionName = personId.substring(personId.indexOf("|") + 1);
            mentionInfo.newMarkdown = this.addDisplayNameForMentions(mentionInfo.newMarkdown, 
                null, mentionId, mentionName, true, isEmptyDisplayName);
            mentionInfo.mentionedPeople.push(personId.substring(0, personId.indexOf("|")));
            mentionInfo.newText = mentionInfo.newText.replace(match[0], mentionName);
        } else {
            //TODO Handle cases when the API call does not specify a name
            inputMessage = addDisplayNameForMentions(inputMessage, null, personId, 
                getDisplayName(personId), false, isEmptyDisplayName);
            mentionInfo.mentionedPeople.push(personId);
        }
    }
    return mentionInfo;
}

MarkdownManipulator.prototype.addDisplayNameForMentions = function (inputMessage, personEmail, personId, displayName, displayNameProvided, isEmptyDisplayName) {
    // TODO Index into tokens.json to see if the ID is asscoiated with a person or a bot (or even exists!)
    // For now we'll just assume its a person
    //String decodedPersonId = ResourceUtility.getStringFromBase64Id(personId, ResourceUtility.ResourceType.PEOPLE);
    //String outputMessage = String.format(HydraMarkdownProperties.OUTPUT_PATTERN, decodedPersonId, displayName);

    let outputMessage = this.OUTPUT_PATTERN.printf(personId, displayName);
    let inputMention = ''
    if (personEmail == null) {
        if (displayNameProvided) {
            inputMention = this.INPUT_PERSONID_PATTERN_WITH_DISPLAYNAME.printf(personId, displayName);
        } else {
            if (isEmptyDisaplayName) {
                inputMention = this.INPUT_PERSONID_PATTERN_WITH_DISPLAYNAME.printf(personId, '');
            } else {
                inputMention = this.INPUT_PERSONID_PATTERN_WITHOUT_DISPLAYNAME.printf(personId);
            }
        }
        return inputMessage.replace(inputMention, outputMessage);
    } else {
        if (displayNameProvided) {
            inputMention = this.INPUT_PERSONEMAIL_PATTERN_WITH_DISPLAYNAME.printf(personEmail, displayName);
        } else {
            if (isEmptyDisaplayName) {
                inputMention = this.INPUT_PERSONEMAIL_PATTERN_WITH_DISPLAYNAME.printf(personEmail, '');
            } else {
                inputMention = this.INPUT_PERSONEMAIL_PATTERN_WITHOUT_DISPLAYNAME.printf(personEmail);
            }
        }
        return inputMessage.replace(inputMention, outputMessage);
    }
}

MarkdownManipulator.prototype.convertMarkdownToHtml = function (markdown) {
    return this.markdown2html.makeHtml(markdown);
}


// Support java like sprintf capabilities
// Works for strings only
String.prototype.printf = function (obj) {
    var useArguments = false;
    var _arguments = arguments;
    var i = -1;
    if (typeof _arguments[0] == "string") {
      useArguments = true;
    }
    if (obj instanceof Array || useArguments) {
      return this.replace(/\%s/g,
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
      return this.replace(/{([^{}]*)}/g,
      function (a, b) {
        var r = obj[b];
        return typeof r === 'string' || typeof r === 'number' ? r : a;
      });
    }
  };
  
  module.exports = MarkdownManipulator;