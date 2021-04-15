
/**
 * Base class for an object that loads arena scripts, player scripts, and so on.
 */
 
class ResourceLoader {
  // The identifier for the game that we're going to load.
  gameId = '';
  
  // Perform any asynchronous initialization that might need to occur.
  async init() {
  }

  // Sets the game that we're going to load resources for.
  async setGame(gameId) {
    this.gameId = gameId;
  }

  // Load the arena for the specified game.
  // Should only be called once per bout.
  async loadArenaScript() {
    throw new Error('ResourceLoader subclass needs to override loadArenaScript.');
  }
  
  // Load UI resources for the spectator.
  // Should only be called once per bout.
  // Returns a map of objects. The map keys and object structure are dependent
  // on the spectator type.
  async loadSpectatorResources(spectatorType) {
    throw new Error('ResourceLoader subclass needs to override loadSpectatorResources.');
  }
  
  
  // Load the script of the next player.
  // Can be called as many times as the arena needs players.
  async loadPlayerScript() {
    throw new Error('ResourceLoader subclass needs to override loadPlayerScript.');
  }
  
  // Load the long-term memory of the player whose script was most recently loaded.
  // Can be called as many times as the arena needs players.
  async loadPlayerLongTermMemory() {
    throw new Error('ResourceLoader subclass needs to override loadPlayerLongTermMemory.');
  }
  
  
  // Perform any asynchronous shutdown logic that might need to take place.
  async shutdown() {
  }
}

module.exports = ResourceLoader;




















