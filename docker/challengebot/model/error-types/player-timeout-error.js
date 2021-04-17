/**
 * Invoked when an arena script wants to access a player,
 * and passes a player number to the player accessor, but
 * no such player with that number is currently connected.
 */
 
const PlayerUnavailableError = require('./player-unavailable-error.js');
 
class PlayerTimeoutError extends PlayerUnavailableError {
  // The number of the player who isn't available.
  playernum = 0;
  
  // The number of milliseconds for which we waited for the player.
  timeoutMs = 0;
  
  constructor(playernum, timeoutMs, message) {
    super(message);
    this.playernum = playernum;
    this.timeoutMs = timeoutMs;
    this.name = "PlayerTimeoutError";
  }
};

module.exports = PlayerTimeoutError;
