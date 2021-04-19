
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
  

  // Gets the ID of the next player slated to join the game.
  async getNextPlayerId() {
    this.currentPlayerNum++;
    return `player__${this.currentPlayerNum}`;
  }  
  
  async loadPlayerScript(playerId) {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    const retval = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/players/${playerId}/script.js`, 
        {encoding: 'utf-8'});
    return retval;
  }
  
  async loadPlayerLongTermMemory(playerId) {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    const retvalJSON = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/players/${playerId}/ltm.json`,
        {encoding: 'utf-8'});
    const retvalObj = JSON.parse(retvalJSON);
    return retvalObj;
  }
  
  async loadPlayerLoot(playerId) {
    if (!this.gameId) {
      throw new Error('Must set gameId before calling loadArenaScript.');
    }
    const retvalJSON = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/${this.gameId}/players/${playerId}/loot.json`,
        {encoding: 'utf-8'});
    const retvalObj = JSON.parse(retvalJSON);
    return retvalObj;
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
// NOTE: No longer used.
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




















