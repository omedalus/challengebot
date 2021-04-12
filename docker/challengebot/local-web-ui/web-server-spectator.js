
// This class relies on the standard NodeJS http server.
// https://www.w3schools.com/nodejs/obj_http_server.asp
const http = require('http');

const Spectator = require('../model/spectator.js');
const WebServerSpectatorMessage = require('./web-server-spectator-message.js');
  

class WebServerSpectator extends Spectator {
  // The web server object that we wrap.
  theServer = null;

  // The port that our server will run on.
  port = 3210;
  
  async init() {
    this.theServer = http.createServer(this.listener);
    this.theServer.listen(this.port, () => {
      console.info(`Server running at http://localhost:${this.port}`);
    });
  }
  
  async shutdown() {
    if (this.theServer) {
      this.theServer.close();
    }
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
  
  // Listener method for the http server.
  listener(req, res) {
    console.log(req);
    res.write('Hello World!');
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


