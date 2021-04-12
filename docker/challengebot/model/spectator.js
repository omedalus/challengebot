/**
 * Base class for something that receives ChallengeBot spectator updates.
 */

class Spectator {
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
  
  // TODO: Provide assignResource methods so that the spectator
  // can be told things like "the arena's HTML is `...`".
}

module.exports = Spectator;

