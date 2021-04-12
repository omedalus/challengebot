const PuppeteerSandbox = require('./puppeteer-sandbox.js');
const Prize = require('./prize.js');

// TODO: Have a way to load a long-term memory object for this player.
// Have the player be notified when the game is over. He'll update
// his long-term memory object and the framework will store it for 
// next time.

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
  
  // If the arena requires an action to be set, then it will set this 
  // promise resolver on the player. This is so that the arena's
  // requirePlayerAction method works.
  actionRequiredResolve = null;
  
  // A promise that resolves when the arena notifies us that the game
  // has finished.
  gameOverPromise = null;
  
  // The resolve method of the gameOverPromise, called by the framework
  // when our game ends.
  gameOverPromiseResolve = null;
  
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
  // of the scan (possibly among other things). This information can
  // also be conveyed via action results that the arena passes to
  // the player when the arena calls notifyPlayerActionCompleted,
  // but some games will prefer it one way and others will prefer it
  // the other.
  sensorReadings = null;
  
  // A short message set by the player via taunt(), and readable by
  // the arena via getPlayerTaunt(). Its only purpose is for funny
  // or insightfun UI updates.
  // TODO: Replace this with a callback that notifies the spectator directly.
  tauntMsg = null;
  
  // List of prizes awarded to the player at the end of the game.
  prizes = [];
  
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
      // isn't trying to do something evil, like take down the puppeteer
      // session with an enormous object that eats all memory.
      const p = new Promise((resolve, reject) => {
        if (this.actionPromiseResolve !== null) {
          reject('Previous action is still in progress.');
          return;
        }
        this.actionParams = actionParams;
        this.actionPromiseResolve = resolve;
        
        if (this.actionRequiredResolve) {
          // Someone was waiting on us to make an action.
          // Notify them that they can stop waiting.
          this.actionRequiredResolve(actionParams);
          this.actionRequiredResolve = null;
        }
      });
      return p;
    });
    
    this.gameOverPromise = new Promise((resolve, reject) => {
      this.gameOverPromiseResolve = resolve;
    });
    
    // Gives the player a promise that resolves when the game ends.
    // The framework calls this method to notify the player that the
    // arena has finished. The player can use this time to examine
    // its prizes and update its long-term memory.
    await this.injectFunction('gameOver', () => {
      return this.gameOverPromise;
    });
    
    // Lets the player access the prizes that the 
    await this.injectFunction('prizes', () => {
      return this.prizes;
    });    
  }
  
  // Resolves and clears the current action promise, if there is one.
  // Resets the current action if it had been set.
  resolveAction(actionResults) {
    if (this.actionPromiseResolve) {
      this.actionPromiseResolve(actionResults);
    }
    this.actionPromiseResolve = null;
    this.actionParams = null;
  }
}

module.exports = PlayerPuppeteerSandbox;


