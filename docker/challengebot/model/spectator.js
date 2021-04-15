/**
 * Base class for something that receives ChallengeBot spectator updates.
 */

class Spectator {
  // A mapping from resource names to values.
  // These are visualization resources that may help with displays in
  // various context-specific formats. For example, for a web spectator,
  // the resources can be an arena's HTML, JS, and CSS files.
  resources = {};

  // A string that helps the resource loader fetch this spectator's assets.
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

