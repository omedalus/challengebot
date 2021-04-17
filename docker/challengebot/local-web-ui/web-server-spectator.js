/**
 * This spectator runs a web server that serves a sort of "degenerate"
 * web page whose sole purpose is to display the game UI. It's best
 * suited for running local instances of game dockers, and allowing
 * the programmer to view the action from a browser running natively
 * on the host OS. 
 * 
 * (It's preferable to marshal the UI to a real browser instead of a 
 * programmatically launched Chromium instance from puppeteer, which 
 * cannot be relied on to work properly in headed mode because of 
 * half a dozen reasons.)
 */
 
// This class relies on the standard NodeJS http server.
// https://www.w3schools.com/nodejs/obj_http_server.asp
// API documentation:
// https://nodejs.org/api/http.html
const http = require('http');
const fs = require('fs');

const Spectator = require('../model/spectator.js');
const WebServerSpectatorMessage = require('./web-server-spectator-message.js');


class WebServerSpectator extends Spectator {
  // The web server object that we wrap.
  theServer = null;
  
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

  getSpectatorResourceType() {
    return 'web-desktop';
  }

  async init() {
    this.theServer = http.createServer(this.listener.bind(this));
    this.theServer.listen(this.port, () => {
      console.info(`Server running at http://localhost:${this.port}`);
    });
  }
  
  async shutdown() {    
    if (this.theServer) {
      await this.theServer.close();
      this.theServer = null;
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
            
    // URLS of the form .../messages/since/###[/] summon a JSON
    // of all messages since the given number (not including
    // that number). If ### happens to
    // exactly equal the number of the last message sent, then
    // wait to return the next message.
    // In all cases, the response, when successful, is a JSON 
    // of an array of message objects.
    let m = url.match(/\/messages\/since\/(?<messagenum>\d+)\/?$/);
    if (m && m.groups && m.groups.messagenum) {
      const messageNumSince = parseInt(m.groups.messagenum, 10) || 0;
      
      // We compare the message number to the message history length.
      // We can do this because the message numbers are 1-indexed.
      if (messageNumSince === this.messageHistory.length) {
        if (!this.newMessagePromise) {
          // There's no new message promise, so there's nothing to wait for.
          // This should be impossible, but that's not the client's problem.
          // Just tell the client there are no messages.
          res.statusCode = 404;
          res.write(JSON.stringify([]));
          res.end();
          return;
        }
        // Send the "current" (i.e. next) message to the client.
        // That means we need to wait for the message to come in.
        // Wait for the promise to resolve before sending the response.
        // Remember, it resolves with the newly added message.
        this.newMessagePromise.then((msg) => {
          // Return a JSON array of length 1, containing the message object.
          res.write(JSON.stringify([msg]));
          res.end();
        });
        return;

      } else if (messageNumSince > this.messageHistory) {
        // The "since" message hasn't even been created yet, so we
        // tell the client to hold their horses.
        res.statusCode = 404;
        res.write(JSON.stringify([]));
        res.end();
        return;
      } 

      // Return the message history since the given messaeg number.
      const respMsgs = this.messageHistory.slice(messageNumSince);
      res.write(JSON.stringify(respMsgs));
      res.end();
      return;
    }
    
    // URLs of the form .../arena/XXXXX summon arena assets.
    m = url.match(/\/arena\/(?<arenaResource>.+)$/);
    if (m && m.groups && m.groups.arenaResource) {
      if (!this.resourceLoader) {
        res.statusCode = 500;
        res.write(`Resource loader not set on spectator.`);
        res.end();
        return;
      }
      const resourceKey = m.groups.arenaResource;
      // NOTE: In theory, we should check for './' and replace it with ''
      // (but we have to be careful in this task because we don't want to
      // turn 'iendwithdot./icontinue' into 'iendwithdoticontinue').
      // In practice, it seems like the browser simplifies this for us
      // when it sends the request, so we are relieved of this responsibility
      // for now.
      
      // The resource loader is async, so handle it as a promise.
      this.resourceLoader.loadSpectatorResource(
          resourceKey, 
          this.getSpectatorResourceType()
      ).then((resource) => {
        if (!resource) {
          res.statusCode = 404;
          res.write(`No such resource: ${resourceKey}`);
          res.end();
          return;
        }
        res.write(resource.data);
        res.end();
      });
      return;
    }
    
    // All other URLS are assumed to be serving local spectator files.
    // These are NOT "resources"; they are the containing infrastructure
    // specific to the WebServerSpectator.
    // NOTE: We used to require that local spectator files be served with
    // the prefix /spectator/, but that seems unnecessary. I'll preserve
    // the regex here though:
    // let m = url.match(/\/spectator\/(?<spectatorResource>.+)$/);
    let urlOrIndex = url;
    if (!urlOrIndex || urlOrIndex.endsWith('/')) {
      urlOrIndex += 'index.html';
    }
    
    const filePath = `./local-web-ui/spectator/${urlOrIndex}`;
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.write(`No such URL: ${url}`);
      res.end();
      return;
    }
    const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
    // NOTE: We don't know content type, but hopefully the browser will be
    // smart enough to figure it out.
    res.write(fileContent);
    res.end();
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


