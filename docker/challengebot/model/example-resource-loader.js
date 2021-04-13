
/**
 * Loads resources from the local filesystem, 
 * from the example-games directory.
 */
const ResourceLoader = require('./resource-loader.js'); 

const fs = require('fs');

const EXAMPLE_GAME_PATH = './example-games/guess100';


class ExampleResourceLoader extends ResourceLoader {
  // The 1-indexed number of the current player being loaded.
  currentPlayerNum = 0;

  async loadArenaScript() {
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/arena/arena.js`, 
        {encoding: 'utf-8'});
    return retval;
  }
  
  async loadPlayerScript() {
    this.currentPlayerNum++;
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/players/player__${this.currentPlayerNum}.js`, 
        {encoding: 'utf-8'});
    return retval;
  }
  
  async loadPlayerLongTermMemory() {
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/players/ltm__${this.currentPlayerNum}.json`,
        {encoding: 'utf-8'});
    return retval;
  }
}

module.exports = ExampleResourceLoader;




















