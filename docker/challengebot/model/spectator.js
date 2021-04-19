/**
 * Base class for something that receives ChallengeBot spectator updates.
 */

class Spectator {
  // If specified, lets the spectator fetch files or other assets upon request.
  resourceLoader = null;

  // A string that helps the resource loader fetch this spectator's assets.
  // For example, if the spectator prints to the console, then the resource
  // loader should be told 'text' or 'ascii' so it'll fetch resources that
  // can print to the console. If the spectator shows web pages, then
  // the resource fetcher should be told to use type 'web' so that it
  // can fetch HTML files and JPEGs and whatnot.
  getSpectatorResourceType() {
    throw new Error('Spectator needs to override getSpectatorResourceType.');
  }
  
  // In case the spectator needs any asynchronous initialization.
  async init() {
    throw new Error('Spectator needs to override init.');
  }
  
  // Receive an update to the UI from the arena.
  async receiveUpdate(update) {
    throw new Error('Spectator needs to override receiveUpdate.');
  }
  
  // Receive a taunt from a player.
  async receiveTaunt(playernum, tauntMsg) {
    throw new Error('Spectator needs to override receiveTaunt.');
  }
  
  // Receive a console message.
  // src is either a number or string. If it's a number, it represents a player.
  // If it's a string, then it must be either 'arena' or 'framework'.
  // TODO: Find a way to pass this info to a unified logger.
  async receiveConsoleMessage(src, consoleMsg) {
    const txt = consoleMsg.text ? consoleMsg.text() : consoleMsg;
    if (txt === 'Failed to load resource: net::ERR_INTERNET_DISCONNECTED') {
      // Never mind. It's just the closing message.
      return;
    }
    
    if (src === 'arena') {
      console.log(`Console log from Arena: ${txt}`);
      return;
    }

    if (src === 'framework') {
      console.log(`Console log from Framework: ${txt}`);
      return;
    }
    
    if (typeof src === 'number') {
      console.log(`Console log from Player ${src}: ${txt}`);
      return;
    }
    
    throw new TypeError(`Unrecognized console message source: ${src}`);
  }  

  // In case the spectator needs any special asynchronous shutdown logic.
  async shutdown() {
    throw new Error('Spectator needs to override shutdown.');
  }
  
  async log(msg) {
    return await this.receiveConsoleMessage('framework', msg);
  }
}

module.exports = Spectator;

