
const PuppeteerSandbox = require('./puppeteer-sandbox.js');
const PlayerAccessor = require('./player-accessor.js');
const Prize = require('./prize.js');

const ArenaError = require('./error-types/arena-error.js');
const PlayerUnavailableError = require('./error-types/player-unavailable-error.js');
const PlayerTimeoutError = require('./error-types/player-timeout-error.js');


class ArenaPuppeteerSandbox extends PuppeteerSandbox {

  // An object set by the caller that permits the arena sandbox to interact
  // with the calling framework, which owns the collection of player objects.
  playerAccessor = null;
  
  // Method set by the caller to pass information along to the spectator(s).
  updateSpectator = async (spectatorParams) => {
    const err = new Error('Caller must set the arena\'s updateSpectator method.');
    throw {...err};
  };

  // Can only create one player at a time.
  isPlayerBeingCreated = false;

  // Tells us if the game has started yet.
  isGameStarted = false;

  // Safeguard function that makes sure we get a meaningful error message
  // if we forgot to set the player accessor.
  ensurePlayerAccessor() {
    if (!this.playerAccessor) {
      // This is not an arena error -- as in, this isn't the fault of the
      // arena script. This is something wrong with the infrastructure.
      // We were supposed to wire up a player accessor, and we didn't.
      // That's not the arena script's fault, that's ours.
      const err = new Error('The arena does not have a player accessor.');
      throw {...err};
    }    
  }

  async init() {
    await super.init();
    
    // Requests for a player to join the game.
    // Can only be invoked once at a time.
    await this.injectFunction('requestPlayer', () => {
      this.ensurePlayerAccessor();
      const p = new Promise((resolve, reject) => {
        if (this.isPlayerBeingCreated) {
          // We can't pass typed errors across the puppeteer boundary, unfortunately.
          // We have to splat them into objects.
          const err = new ArenaError('The previous player creation request is still in progress.');
          reject({...err});
          return;
        }
        this.isPlayerBeingCreated = true;
        
        this.playerAccessor.createPlayer().then((player) => {
          resolve(player.playernum);
        }).
        catch((err) => {
          // We can't pass typed errors across the puppeteer boundary, unfortunately.
          // We have to splat them into objects.          
          reject({...err});
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
    // This method is nondestructive and non-blocking. It retrieves whatever
    // action the player had last set, and doesn't clear it.
    await this.injectFunction('getPlayerAction', (playernum) => {
      const player = this.getPlayer(playernum);
      return player.actionParams;
    });
    
    // A convenience method that simultaneously collects all player actions.
    // It returns a map, keyed by player numbers, to the action results.
    await this.injectFunction('getAllPlayersActions', () => {
      this.ensurePlayerAccessor();
      const allPlayerActions = {};
      this.playerAccessor.getPlayerCollection().forEach((p) => {
        allPlayerActions[p.playernum] = p.actionParams;
      });
      return allPlayerActions;
    });
    
    // Retrieves the action that the player had set with a call to action(), if
    // there is one. If not, then blocks until either the player sets an action
    // or the timeout expires.
    await this.injectFunction('requirePlayerAction', (playernum, maxWaitMs) => {
      const player = this.getPlayer(playernum);
      return this.requirePlayerAction(player, maxWaitMs);
    });
    
    // Convenience method that simultaneously waits for all players to provide
    // an action, and times out players who don't. Returns a map of result objects.
    // Each result object will have either an 'action' field or an 'error' field,
    // respectively.
    await this.injectFunction('requireAllPlayersActions', (maxWaitMs) => {
      let numPromisesWaiting = this.playerAccessor.getPlayerCollection().length;
      const allPlayerActions = {};
      const p = new Promise((resolve, reject) => {
        this.playerAccessor.getPlayerCollection().forEach((player) => {
          this.requirePlayerAction(player, maxWaitMs).
              then((actionParams) => {
                allPlayerActions[player.playernum] = {action: player.actionParams};
              }).
              catch((err) => {
                allPlayerActions[player.playernum] = {error: err};
              }).
              finally(() => {
                numPromisesWaiting--;
                if (numPromisesWaiting <= 0) {
                  resolve(allPlayerActions);
                }
              });
        });
      });
      return p;
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
    // Clears the player's last action, as well as the promise resolver.
    // Note that this modifies the player object!
    await this.injectFunction('notifyPlayerActionCompleted', (playernum, actionResults) => {
      const player = this.getPlayer(playernum);
      player.resolveAction(actionResults);
    });
    
    // Adds a prize to the player's collection of prizes won in this game.
    await this.injectFunction('awardPlayerPrize', (playernum, prizeLabel, prizeArg1, prizeArg2, prizeArg3) => {
      const prize = new Prize(prizeLabel, prizeArg1, prizeArg2, prizeArg3);
      const player = this.getPlayer(playernum);
      player.prizes.push(prize);
    });

    // Removes the player from the game.
    await this.injectFunction('removePlayer', (playernum) => {
      const player = this.getPlayer(playernum);
      this.playerAccessor.removePlayer(player);
    });
  }

  // Get the player with the playernum playernum from the player accessor's
  // collection. This method is guaranteed to return a player object, or throw.
  getPlayer(playernum) {
    this.ensurePlayerAccessor();
    const player = this.
        playerAccessor.
        getPlayerCollection().
        find((p) => p.playernum === playernum);
    if (!player) {
      const err = new PlayerUnavailableError(playernum, `No such player with number: ${playernum}`);
      throw {...err};
    }
    return player;
  }

  // Call the run method on all player sandboxes. This is NOT an asynchronous
  // function! It does not block while they run; they can all run in parallel.
  runAllPlayers() {
    this.ensurePlayerAccessor();
    this.playerAccessor.getPlayerCollection().forEach((p) => {
      // Launch the script in the sandbox. Again, this is all happening
      // in parallel; the script can run forever for all we care.
      p.run();
    });
  }
  
  
  // Retrieves the action that the player had set with a call to action(), if
  // there is one. If not, then blocks until either the player sets an action
  // or the timeout expires.
  requirePlayerAction(player, maxWaitMs) {
    if (typeof maxWaitMs !== 'number' || maxWaitMs < 1) {
      const err = new TypeError('Player action timeout needs to be specified as a number greater than 1.');
      throw {...err};
    }      
    maxWaitMs = Math.ceil(Math.max(1, maxWaitMs || 1));      
    
    player.actionRequiredResolve = null;
    if (player.actionParams) {
      return Promise.resolve(player.actionParams);
    }
    const p = new Promise((resolve, reject) => {
      player.actionRequiredResolve = resolve;
      this.page.waitForTimeout(maxWaitMs).finally(() => {
        // If the timeout has passed and resolve has no been called, then 
        // the player has never called their action() method in the allotted time,
        // and they must be rejected. Note that if resolve HAS been called, then
        // the promise is already fulfilled and therefore this call to reject
        // will do nothing, so it's safe.
        const err = new PlayerTimeoutError(
            player.playernum, 
            maxWaitMs,
            `Player ${player.playernum} timed out after ${maxWaitMs} ms.`
        );
        // We can't pass typed errors across the puppeteer boundary, unfortunately.
        // We have to splat them into objects.        
        reject({...err});
      });
    });
    return p;
  }  
}

module.exports = ArenaPuppeteerSandbox;




















