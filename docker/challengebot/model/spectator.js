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

  // In case the spectator needs any special asynchronous shutdown logic.
  async shutdown() {
    throw new Error('Spectator needs to override shutdown.');
  }
}

module.exports = Spectator;

