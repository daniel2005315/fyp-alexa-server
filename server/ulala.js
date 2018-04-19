var request= require('request');
// access Database
var model = require('../db/model.js');

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
				console.log("[doRequest]res received");
        resolve(body);
      } else {
				console.log("Status code:"+res.statusCode);
				console.log("[doRequest]rejected, error=>"+error);
        console.log("[doRequest err] res body:");
        console.log(res.body);
        reject(error);
      }
    });
  });
}

// TODO Line request, involving transform of line user id into accesstoken
async function line_request(userId,message){
  // Read database
  try{
    let result= await model.findUserLine(userId);
    if(result!=null){
      console.log("[line_request] Got user");
      console.log(result);
    }else{
      console.log("[line_request] User not in db");
      result={"name":"dummy","accessToken":"visitorToken777"};
    }
    let res = await make_request(result.access_token, message);
    return res;
  }catch(err){
    console.log(err);
  }

}

// make_request(accessToken, message)
async function make_request(accessToken, message){
  // test making own request to entry
  try{
    options = {
      headers: {
        "SignatureCertChainUrl": "https://s3.amazonaws.com/echo.api/echo-api-cert.pem"
      },
        url: 'https://alexa-server-ck.herokuapp.com/alexa/my_friend',
        method: 'POST',
        json:true,
        body: {
          "version": "1.0",
          "session": {
            "new": true,
            "sessionId": "amzn1.echo-api.session.newseession123",
            "application": {
              "applicationId": "amzn1.ask.skill.479c8c69-349f-42f0-896aty-7c6a8c3b267d"
            },
            "attributes": {
              "key": "string value"
            },
            "user": {
              // token from our server
              "accessToken": accessToken
            }
          },
          "context": {
            "System": {
              "device": {
                "deviceId": "string",
                "supportedInterfaces": {
                  "AudioPlayer": {}
                }
              },
              "application": {
                "applicationId": "amzn1.ask.skill.479c8c69-349f-42f0-896a-7c6a8c3b267d"
              },
              "user": {
  				//"userId": "amzn1.ask.account.AEZ4JMMP3EHYLEQDJIJAVWMSW3YWBU4IT4TIZ6PTEAD4GGBGCQ2AGT4QAL3KMW53V5DJSZSY5XKRR4HI3JRDTKBHTXUTO7WFXYBXCY2OATJ4BJB5OTQQMLHC4IKKBZWOBYDZYFULUFAR4XIY666VZ7H6OASEH4KHNZHP4YMNHXSRW6UWHYQJMSQK2D6OEVKD6ATFE2RHESEY73I",
  				"accessToken": "101ihave1nc3th5le1f5oeishahaline"
  			}
            },
            "AudioPlayer": {
              "playerActivity": "PLAYING",
              "token": "audioplayer-token",
              "offsetInMilliseconds": 0
            }
          },
          "request": {
          		"type": "IntentRequest",
          		"requestId": "amzn1.echo-api.request.a27e98c6-70f7-458e-9b79-399f308ef15b",
          		//"timestamp": "2018-04-18T18:56:28Z",
          		"locale": "en-US",
          		"intent": {
          			"name": "CatchAllIntent",
          			"confirmationStatus": "NONE",
          			"slots": {
          				"speech": {
          					"name": "speech",
                    // replace value with line message
          					"value": message,
          					"resolutions": {
          						"resolutionsPerAuthority": [
          							{
          								"authority": "amzn1.er-authority.echo-sdk.amzn1.ask.skill.479c8c69-349f-42f0-896a-7c6a8c3b267d.CatchAll",
          								"status": {
          									"code": "ER_SUCCESS_NO_MATCH"
          								}
          							}
          						]
          					},
          					"confirmationStatus": "NONE"
          				}
          			}
          		}
          	}
        }

    };

    let res=await doRequest(options);
    var reply=res.response.outputSpeech.ssml;
    reply=reply.substring(reply.indexOf(">")+1,reply.lastIndexOf("<"));
    return reply;
    console.log(reply);
  }catch(err){
    console.log(err);
    return "Sorry there was an error";
  }
}

// Sending line push message to user
// including Sender's name
async function line_push(lineID,message,source){
  options={
      headers: {"Authorization": "Bearer rnbw0w2L4LHCCHnRU07CjzH42oYYN7INtOpXoHqsSOJibHfhUpKI7UUN/t8xlZbLh8GqNefkYOtD5iFbvPLvDP3XyKPtmUdZWO2E4JWxhxNmIfSpNbjszL8uneB+eSEEmCmf9Th1KFFhKDSgQWHnKwdB04t89/1O/w1cDnyilFU="},
      url: "https://api.line.me/v2/bot/message/push",
      method: 'POST',
      json:true,
      body:{
        "to": lineID,
        "messages": [{
          "type": "text",
          "text": "Hello, world"
        }]
      }
  };
  try{
    // sending push message to ask user to link account
    let result= await doRequest(options);
    return true;
  }catch(err){
    console.log(err);
  }
}
/*
{
    "type": "text",
    "text": "You've got a message from "+source+"!"
},
*/

module.exports ={
  make_request: make_request,
  line_request:line_request,
  line_push:line_push
}
