
const ArenaPuppeteerSandbox = require('./model/arena-puppeteer-sandbox.js');
const PlayerPuppeteerSandbox = require('./model/player-puppeteer-sandbox.js');
const PlayerAccessor = require('./model/player-accessor.js');

const WebServerSpectator = require('./local-web-ui/web-server-spectator.js');

const ExampleResourceLoader = require('./model/example-resource-loader.js');

const main = async () => {  
  const resourceLoader = new ExampleResourceLoader();
  await resourceLoader.init();
  // TODO: The resource loader type and the game ID both need to come
  // from the commandline.
  await resourceLoader.setGame('guess100');

  // TODO: The spectator can be the local web server, OR it can involve
  // writing to an AWS endpoint. We need to set up the command line to
  // decide.
  const spectator = new WebServerSpectator();
  spectator.resourceLoader = resourceLoader;
  await spectator.init();
  
  const playerSandboxes = [];
  
  const playerAccessor = new PlayerAccessor();
  
  playerAccessor.getPlayerCollection = () => {
    return playerSandboxes;
  };
  
  playerAccessor.createPlayer = async () => {
    const playerSandbox = new PlayerPuppeteerSandbox();

    spectator.log('Next player requested.');
    playerSandbox.id = await resourceLoader.getNextPlayerId();
    
    spectator.log(`Loading resources for player: ${playerSandbox.id}`);
    
    playerSandbox.script = await resourceLoader.loadPlayerScript(playerSandbox.id);
    spectator.log(` - Script loaded for player: ${playerSandbox.id}`);
    
    try {
      playerSandbox.myLongTermMemory = await resourceLoader.loadPlayerLongTermMemory(playerSandbox.id);
      spectator.log(` - Long-term memory loaded for player: ${playerSandbox.id}`);
    } catch (err) {
      playerSandbox.myLongTermMemory = {};
      spectator.log(` - ERROR while loading long-term memory for player: ${playerSandbox.id}`);
      spectator.log(err);
    }

    try {
      playerSandbox.myLoot = await resourceLoader.loadPlayerLoot(playerSandbox.id);
      spectator.log(` - Loot loaded for player: ${playerSandbox.id}`);
    } catch (err) {
      playerSandbox.myLoot = {};
      spectator.log(` - ERROR while loading loot for player: ${playerSandbox.id}`);
      spectator.log(err);
    }
    
    playerSandboxes.push(playerSandbox);
    playerSandbox.playernum = playerSandboxes.length;

    playerSandbox.onTaunt = async (tauntMsg) => {
      await spectator.receiveTaunt(playerSandbox.playernum, tauntMsg);
    };
    playerSandbox.onConsoleMessage = (consoleMsg) => {
      spectator.receiveConsoleMessage(playerSandbox.playernum, consoleMsg);
    };

    spectator.log(`Launching player ${playerSandbox.playernum}!`);
    await playerSandbox.init();

    return playerSandbox;
  };
 
  playerAccessor.removePlayer = async (player) => {
    if (player) {
      await player.shutdown();
    }
  };
 
  const arenaSandbox = new ArenaPuppeteerSandbox();
  await arenaSandbox.init();
  
  arenaSandbox.playerAccessor = playerAccessor;
  
  arenaSandbox.onConsoleMessage = (consoleMsg) => {
    spectator.receiveConsoleMessage('arena', consoleMsg);
  };
  
  // Load the arena script.
  // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
  arenaSandbox.script = await resourceLoader.loadArenaScript();
  
  arenaSandbox.updateSpectator = async (spectatorParams) => {
    await spectator.receiveUpdate(spectatorParams);
  };

  // --------------------
  // RUN THE GAME!!!
  //
  spectator.log('Launching the arena!');
  await arenaSandbox.run();

  // --------------------
  // Handle endgame
  
  spectator.log('Arena has completed. Waiting for players to complete.');
  const playerShutdownPromises = [];
  for (let psbx of playerSandboxes) {
    // Notify them that the game is over, and give them each 60 seconds
    // to shut down.
    if (psbx.gameOverPromiseResolve) {
      psbx.gameOverPromiseResolve();
      psbx.gameOverPromiseResolve = null;
    }
    const playerShutdownPromise = psbx.
        ensureTimedShutdown(60 * 1000).
        then(() => {
          spectator.log(`  [X] Player ${psbx.playernum}: ${psbx.id}`);
        });
    playerShutdownPromises.push(playerShutdownPromise);
  }
  await Promise.allSettled(playerShutdownPromises);
  
  
  // TODO: Move the after-action handling into the ResourceLoader.
  if (arenaSandbox.error) {
    console.log('Arena encountered an error. None of the results count.');
    console.error(arenaSandbox.error);
    
  } else {
    // --------------------
    // Player results!
    // This corresponds to data that we will write to databases IRL.
    console.log('\n\n=== Player results! ===');
    for (let psbx of playerSandboxes) {
      console.log(`--- Player ${psbx.playernum}: ${psbx.id} ---`);
      await psbx.runPromise;
      
      if (psbx.error) {
        console.log('  Died in disgrace. Gains no prizes and learns nothing. Error:');
        console.log(psbx.error);
        return;
      }
      console.log(`  Received prizes:`);
      psbx.prizes.forEach((prize) => {
        console.log(`    - ${prize}`);
      });

      console.log('  And what did we learn from this?');
      console.log(psbx.myLongTermMemory);
      // TODO: Write LTM

      console.log('  Writing player results to DB...');
      // TODO: Do that.
      console.log('  ...Done.');
    };
    console.log('\n\n');  
  }
  
  spectator.log('Awaiting resource loader shutdown.');
  await resourceLoader.shutdown();

  spectator.log('Awaiting spectator shutdown.');
  await spectator.shutdown();
};


(async () => {
  try {
    await main();
    // Ensure that we exit, even if there are still timeouts lingering.
    process.exit();  
  } catch (err) {
    console.error(err);
    process.exit(1);  
  }
})();


