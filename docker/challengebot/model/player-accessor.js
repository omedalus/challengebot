
/**
 * An object that helps the ArenaPuppeteerSandbox access a collection of
 * PlayerPuppeteerSandbox objects, so that the arena sandbox doesn't
 * need to keep track of a player sandbox collection. This means the ownership
 * of player objects is unambiguous: the calling framework owns the
 * canonical collection of player sandbox objects, just like it owns this
 * arena sandbox object.
 */
 
class PlayerAccessor  {

  // Method set by the caller to provide the arena with a hook to
  // call when instantiating new players. 
  // Returns a new player object. The player object must have playernum set.
  createPlayer = async () => {
    throw new Error('Caller must set the createPlayer method.');
  };

  // Method set by the caller to provide the arena with a hook to
  // call when removing players. 
  // Takes a PlayerPuppeteerSandbox object, presumably one that is
  // in the player collection.
  removePlayer = async (player) => {
    throw new Error('Caller must set the removePlayer method.');
  };

  
  // Method set by the caller to retrieve an iterable collection of players.
  // Players are not assumed to be in any particular order within this
  // iterable collection.
  getPlayerCollection = () => {
    throw new Error('Caller must set the getPlayerCollection method.');
  };

}

module.exports = PlayerAccessor;




















