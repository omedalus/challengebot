
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
  
  async loadSpectatorResource(resourceKey, spectatorType) {
    if (spectatorType !== 'web-desktop') {
      throw new Error(`Don\'t know how to load resources of type: ${spectatorType}`);
    }
    const filePath = `${EXAMPLE_GAME_PATH}/${this.gameId}/spectator/${resourceKey}`;
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, {encoding: 'utf-8'});
    // NOTE: We don't know the content type. If we did, we'd add it as
    // part of the result object.
    return {
      data: fileContent
    }
  }
  
}

// Yoinked and adapted from:
// https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
const walkFiles = (basedir, dir) => {
  if (typeof dir === 'undefined') {
    dir = '';
  }
  
  let results = {};
  const list = fs.readdirSync(basedir + '/' + dir);
  list.forEach((file) => {
    const key = dir ? (dir + '/'  + file) : file;
    const stat = fs.statSync(basedir + '/' + key);
    if (stat && stat.isDirectory()) { 
      // Recurse into a subdirectory 
      results = {
        ...results,
        ...walkFiles(basedir, key)
      };
    } else { 
      // Is a file 
      const isBinary = false;
      const contentType = '';
      const data = fs.readFileSync(
          basedir + '/' + key, 
          isBinary ? {} : {encoding: 'utf-8'}
      );
      
      results[key] = {
        key,
        contentType,
        data
      };      
    }
  });
  return results;
}

module.exports = ExampleResourceLoader;




















