
/**
 * Loads resources from the local filesystem, 
 * from the example-games directory.
 */
const ResourceLoader = require('./resource-loader.js'); 

const fs = require('fs');

const EXAMPLE_GAME_PATH = './example-games';


class ExampleResourceLoader extends ResourceLoader {
  // The 1-indexed number of the current player being loaded.
  currentPlayerNum = 0;

  async loadArenaScript() {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/arena/arena.js`, 
        {encoding: 'utf-8'});
    return retval;
  }
  
  async loadPlayerScript() {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    this.currentPlayerNum++;
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/players/player__${this.currentPlayerNum}.js`, 
        {encoding: 'utf-8'});
    return retval;
  }
  
  async loadPlayerLongTermMemory() {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    if (!this.currentPlayerNum) {
      throw new Error('Must load a player with a call to loadPlayerScript before loading player long-term memory.');
    }
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/players/ltm__${this.currentPlayerNum}.json`,
        {encoding: 'utf-8'});
    return retval;
  }
}

module.exports = ExampleResourceLoader;




















