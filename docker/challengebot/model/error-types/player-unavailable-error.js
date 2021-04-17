/**
 * Invoked when an arena script wants to access a player,
 * and passes a player number to the player accessor, but
 * no such player with that number is currently connected.
 * The player might have crashed, or the arena might have
 * requested the wrong player.
 */
 
const ArenaError = require('./arena-error.js');
 
class PlayerUnavailableError extends ArenaError {
  // The number of the player who isn't available.
  playernum = 0;
  
  constructor(playernum, message) {
    super(message);
    this.playernum = playernum;
    this.name = "PlayerUnavailableError";
  }
};

module.exports = PlayerUnavailableError;
