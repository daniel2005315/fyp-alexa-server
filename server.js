'use strict';

var AlexaAppServer = require("alexa-app-server");

var server = new AlexaAppServer({
  server_root: './',
  httpsEnabled: true,
  port: process.env.PORT||8080,

});

server.start();
