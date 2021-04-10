const PuppeteerSandbox = require('./puppeteer-sandbox.js');

class PlayerPuppeteerSandbox extends PuppeteerSandbox {
  // The global ID of the player, presumably identifying their script.
  id = '0';
  
  // The number of this player within the arena. This is not directly
  // available to the player, because some games might permit them some
  // kind of secret knowledge based on this number (for example, an 
  // implementation of Werewolf in which Player #0 is always the
  // werewolf). The arena may choose to expose this 
  playernum = 0;
  
  // If a player has commanded an action, then their sandbox
  // will receive a promise that won't be resolved until the 
  // arena tells them they may proceed. The return value of the
  // player's action() method will be the resolved value
  // of this promise. The player may choose to block and await
  // this promise, or they may choose to handle it asynchronously
  // via a then() call and perform other processing in parallel
  // (as long as they remember to yield when the promise resolves, 
  // otherwise they'll be frozen).
  //
  // The arena script resolves this promise by calling 
  // notifyPlayerActionCompleted.
  actionPromiseResolve = null;
  
  // The last action set by the player.
  // This corresponds to what was set by the player when they 
  // called action({...}), and it's what's returned to the arena
  // when the arena calls getPlayerAction.
  actionParams = null;
  
  // Everything the player can currently see of the game world.
  // Set by the arena through setPlayerSensors (or updated through
  // updatePlayerSensors). Read by the player via the sensors() method.
  // Can be dependent on the last action performed by the player;
  // for example, if the game is Star Trek and the player performed
  // a "scan" action, then this variable would contain the results
  // of the scan (possibly among other things).
  sensorReadings = null;
  
  // A short message set by the player via taunt(), and readable by
  // the arena via getPlayerTaunt(). Its only purpose is for funny
  // or insightfun UI updates.
  tauntMsg = null;
  
  
  async init() {
    await super.init();
    
    await this.injectFunction('sensors', () => {
      return this.sensorReadings;
    });
    
    await this.injectFunction('taunt', (tauntMsg) => {
      if (typeof tauntMsg !== 'undefined') {
        this.tauntMsg = tauntMsg;
      }
      return this.tauntMsg;
    });
    
    await this.injectFunction('action', (actionParams) => {
      // TODO: Ensure that the structure is proper and that the player
      // isn't trying to do something evil.
      const p = new Promise((resolve, reject) => {
        if (this.actionPromiseResolve !== null) {
          reject('Previous action is still in progress.');
          return;
        }
        this.actionParams = actionParams;
        this.actionPromiseResolve = resolve;
      });
      return p;
    });
  }
}

module.exports = PlayerPuppeteerSandbox;


