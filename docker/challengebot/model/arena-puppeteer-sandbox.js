
const PuppeteerSandbox = require('./puppeteer-sandbox.js');

// TODO: Have a way to end the game and report results.

class ArenaPuppeteerSandbox extends PuppeteerSandbox {

  // Method set by the caller to provide the arena with a hook to
  // call when instantiating new players. 
  // Returns a new player object. The player object must have playernum set.
  createPlayer = async () => {
    throw new Error('Caller must set the arena\'s createPlayer method.');
  };
  
  // Method set by the caller to retrieve a player by numerical index.
  // Together with createPlayer, this means that the arena sandbox doesn't
  // need to keep track of a player sandbox collection. Therefore, the ownership
  // of player objects is unambiguous: the calling framework owns the
  // canonical collection of player sandbox objects, just like it owns this
  // arena sandbox object.
  // Returns a player object previously created by createPlayer.
  getPlayer = (playernum) => {
    throw new Error('Caller must set the arena\'s createPlayer method.');
  };
  
  // Method set by the caller to invoke the run method of all of the player
  // sandboxes. This way, they all spin up at the same time, thus avoiding 
  // any extra runtime that an earlier-loaded player might have gotten while
  // a later-loaded player's file was retrieved.
  runAllPlayers = async () => {
    throw new Error('Caller must set the arena\'s runAllPlayers method.');
  };
  
  // Method set by the caller to pass information along to the spectator(s).
  updateSpectator = async (spectatorParams) => {
    throw new Error('Caller must set the arena\'s updateSpectator method.');
  };

  // Can only create one player at a time.
  isPlayerBeingCreated = false;

  // Tells us if the game has started yet.
  isGameStarted = false;

  async init() {
    await super.init();
    
    // Requests for a player to join the game.
    // Can only be invoked once at a time.
    await this.injectFunction('requestPlayer', () => {
      const p = new Promise((resolve, reject) => {
        if (this.isPlayerBeingCreated) {
          reject('The previous player creation request is still in progress.');
          return;
        }
        this.isPlayerBeingCreated = true;
        
        this.createPlayer().then((player) => {
          resolve(player.playernum);
        }).
        catch((err) => {
          reject(err)
        }).
        finally(() => {
          this.isPlayerBeingCreated = false;
        });
      });
      return p;
    });
    
    // Starts the game, which launches all players.
    await this.injectFunction('startGame', async () => {
      await this.runAllPlayers();
      this.isGameStarted = true;
    });
    
    // Passes information along to the spectator.
    await this.injectFunction('updateSpectator', async (spectatorParams) => {
      await this.updateSpectator(spectatorParams);
    });
    
    // Retrieves the action that the player had set with a call to action().
    await this.injectFunction('getPlayerAction', (playernum) => {
      const player = this.getPlayer(playernum);
      return player.actionParams;
    });

    // Retrieves the taunt that the player had set with a call to taunt().
    await this.injectFunction('getPlayerTaunt', (playernum) => {
      const player = this.getPlayer(playernum);
      return player.actionParams;
    });
    
    // Sets the sensor readings that the player will retrieve with a call to sensors().
    await this.injectFunction('setPlayerSensors', (playernum, sensorReadings) => {
      const player = this.getPlayer(playernum);
      player.sensorReadings = sensorReadings;
      return player.sensorReadings;
    });
    
    // Updates the sensor readings that the player will retrieve with a call to sensors().
    // This differs from setPlayerSensors in that it modifies whatever sensor readings
    // object was already present, if any.
    await this.injectFunction('updatePlayerSensors', (playernum, sensorReadingUpdates) => {
      const player = this.getPlayer(playernum);
      player.sensorReadings = player.sensorReadings || {};
      Object.assign(player.sensorReadings, sensorReadingUpdates);
      return player.sensorReadings;
    });
    
    // Resolve the player's promise that was created when they issued their last action.
    await this.injectFunction('notifyPlayerActionCompleted', (playernum, actionResults) => {
      const player = this.getPlayer(playernum);
      if (player && player.actionPromiseResolve) {
        const fnResolve = player.actionPromiseResolve;
        player.actionPromiseResolve = null;
        fnResolve(actionResults);
      }
    });

    await this.injectFunction('sleep', async (ms) => {
      await this.page.waitForTimeout(ms);
    });

    
  }
}

module.exports = ArenaPuppeteerSandbox;




















