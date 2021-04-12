/**
 * Base class for something that receives ChallengeBot spectator updates.
 */

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

