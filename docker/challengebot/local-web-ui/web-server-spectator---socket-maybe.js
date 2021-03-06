
// This class relies on the standard NodeJS http server.
// https://www.w3schools.com/nodejs/obj_http_server.asp
const http = require('http');
const fs = require('fs');

// The WebSocket parts below come from
// https://www.npmjs.com/package/websocket
const WebSocketServer = require('websocket').server;

const Spectator = require('../model/spectator.js');
const WebServerSpectatorMessage = require('./web-server-spectator-message.js');


class WebServerSpectator extends Spectator {
  // The web server object that we wrap.
  theServer = null;
  
  theSocketServer = null;

  // The port that our server will run on.
  port = 3210;

  // A log of every update and taunt received.
  messageHistory = [];

  // The wallclock time when the first message was received.
  timestampFirstMessage = null;

  // A promise that gets resolved when a new message comes in.
  // A new one gets created every time a message arrives and the
  // old one gets resolved.
  // Resolves with a message object.
  newMessagePromise = null;
  
  // The resolve method for the new message promise. Replaced every
  // time a new message comes in and the old one gets resolved.
  // Takes a message as an argument.
  newMessagePromiseResolve = null;
  
  // The reject method for the new message promise. Called on shutdown.
  newMessagePromiseReject = null;
  

  addMessage(type, data, player) {
    const msg = new WebServerSpectatorMessage();
    msg.message_type = type;
    msg.player = player || 0;
    msg.data = data;
    
    if (!this.timestampFirstMessage) {
      this.timestampFirstMessage = Date.now();
      msg.gametime_ms = 0;
    } else {
      msg.gametime_ms = Date.now() - this.timestampFirstMessage;
    }
    
    this.messageHistory.push(msg);
    
    const numMsgs = this.messageHistory.length;
    msg.message_num = numMsgs;
    this.messageHistory.forEach((m) => m.message_count = numMsgs);
    
    if (this.newMessagePromiseResolve) {
      this.newMessagePromiseResolve(msg);
    }
    
    this.newMessagePromise = new Promise((resolve, reject) => {
      this.newMessagePromiseResolve = resolve;
      this.newMessagePromiseReject = reject;
    });
  }

  async init() {
    this.theServer = http.createServer(this.listener.bind(this));
    this.theServer.listen(this.port, () => {
      console.info(`Server running at http://localhost:${this.port}`);
    });
    
    this.theSocketServer = new WebSocketServer({
      httpServer: this.theServer,
      autoAcceptConnections: false
    });
    this.theSocketServer.on('request', this.websocketListener.bind(this));
  }
  
  async shutdown() {    
    if (this.theServer) {
      await this.theServer.close();
      this.theServer = null;
    }
    
    if (this.theSocketServer) {
      // The socket server was closed when the HTTP server was closed.
      this.theSocketServer = null;
    }    
    
    if (this.newMessagePromiseReject) {
      this.newMessagePromiseReject(new Error('HTTP server shutdown.'));
      this.newMessagePromiseReject = null;
      this.newMessagePromiseResolve = null;
      this.newMessagePromise = null;
    }
  }
  
  async receiveUpdate(update) {
    this.addMessage('ui', update);
  }
  
  async receiveTaunt(playernum, tauntMsg) {
    this.addMessage('taunt', tauntMsg, playernum);
  }  
  
  // Listener method for the http server.
  listener(req, res) {
    // Let's parse the request URL to figure out what is being requested.
    // We only examine the end of the request because we don't know what
    // path within the domain we'll be deployed on.
    // Are we receiving a request for:
    // - Our container web assets (html/css/js/etc)?
    // - Our arena web assets (html/css/js/etc)?
    // - The next message?
    // - The last message?
    // - A specific numbered message?
    // - The entire message history?
    // - The history since some message?
    const [url, querystring] = req.url.split('?');
    
    // URLS of the form .../spectator/xxxx summon spectator container assets.
    let m = url.match(/\/spectator\/(?<spectatorResource>.+)$/);
    if (m && m.groups && m.groups.spectatorResource) {
      const filePath = `./local-web-ui/spectator/${m.groups.spectatorResource}`;
      const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
      res.write(fileContent);
      res.end();
      return;
    }
    
        //res.write(JSON.stringify(this.messageHistory));
    //res.end();    
    
    // We're going to try to implement this as a long poll.
    res.write(JSON.stringify(this.messageHistory));
    const awaitNextMessage = () => {
      if (!this.newMessagePromise) {
        res.end();
        return;
      }
      this.newMessagePromise.then((msg) => {
        res.write(JSON.stringify(msg));
        awaitNextMessage();
      }).catch((err) => {
        res.write(JSON.stringify(err));
        res.end();
      });
    };
    awaitNextMessage();
  }
  
  
  websocketListener(request) {
    // TODO: Make sure that request.origin is a permitted origin.
    // If it doesn't, call request.reject().
    let connection = null;
    try {
      connection = request.accept('challengebot-web-spectator', request.origin);
    } catch (err) {
      console.warn(err);
      return;
    }

    // Upon connection, the first thing we do is send the entire message history
    // built up to date.
    connection.sendUTF(JSON.stringify(this.messageHistory));
    
    /*
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log('Received Message: ' + message.utf8Data);
        connection.sendUTF(message.utf8Data);
      }
      else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
      }
    });
    connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    */
  }
};

module.exports = WebServerSpectator;










/*
 * Base class for something that receives ChallengeBot spectator updates.

const Spectator = require('../model/spectator.js');

class ConsoleSpectator extends Spectator {
  async init() {
  }
  
  async receiveUpdate(update) {
    if (typeof update !== 'string' && typeof update !== 'number') {
      update = JSON.stringify(update);
    }
    console.log(`ARENA update: ${update}`);
  }
  
  // Receive a taunt from a player.
  async receiveTaunt(playernum, tauntMsg) {
    if (typeof tauntMsg !== 'string' && typeof tauntMsg !== 'number') {
      tauntMsg = JSON.stringify(tauntMsg);
    }
    console.log(`TAUNT from Player ${playernum}: ${tauntMsg}`);
  }

  async shutdown() {
  }  
}

module.exports = ConsoleSpectator;
 */











/*
const static = require('node-static');
const myStaticFileServer = new static.Server('./challengebot/local-web-ui/');

const http = require('http');
const myWebServer = http.createServer((req, res) => {
  req.addListener('end', () => myStaticFileServer.serve(req, res)).resume();
});
const port = 3210;
myWebServer.listen(port, () => console.log(`Server running at http://localhost:${port}`));

// The parts below come from
// https://www.npmjs.com/package/websocket
const WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
  httpServer: myWebServer,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  autoAcceptConnections: false
});

function originIsAllowed(origin) {
  console.log(`WebSocket connection request from ${origin}`);
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
  console.log('Request body');
  console.log(JSON.stringify(request));
  
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  
  const connection = request.accept('json', request.origin);
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      console.log('Received Message: ' + message.utf8Data);
      connection.sendUTF(message.utf8Data);
    }
    else if (message.type === 'binary') {
      console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
      connection.sendBytes(message.binaryData);
    }
  });
  connection.on('close', function(reasonCode, description) {
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });
});
*/


