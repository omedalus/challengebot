
/**
 * Base class for an object that loads arena scripts, player scripts, and so on.
 * Also responsible for saving updates to things like player long-term memory,
 * seeing as it's saved back to the same place it's loaded from.
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
  // Called by the spectator.
  // Returns a map of objects. The map keys and object structure are dependent
  // on the spectator type.
  async loadSpectatorResource(resourceKey, spectatorType) {
    throw new Error('ResourceLoader subclass needs to override loadSpectatorResources.');
  }
  
  
  // Load the script of the next player.
  // Can be called as many times as the arena needs players.
  async loadPlayerScript() {
    throw new Error('ResourceLoader subclass needs to override loadPlayerScript.');
  }
  
  // Load the long-term memory of a player.
  async loadPlayerLongTermMemory(playerId) {
    throw new Error('ResourceLoader subclass needs to override loadPlayerLongTermMemory.');
  }
  
  // Save a player's long-term memory.
  async savePlayerLongTermMemory(playerId) {
    throw new Error('ResourceLoader subclass needs to override savePlayerLongTermMemory.');
  }
  
  // Perform any asynchronous shutdown logic that might need to take place.
  async shutdown() {
  }
}

module.exports = ResourceLoader;




















