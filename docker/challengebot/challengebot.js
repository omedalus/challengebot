
const ArenaPuppeteerSandbox = require('./model/arena-puppeteer-sandbox.js');
const PlayerPuppeteerSandbox = require('./model/player-puppeteer-sandbox.js');
const PlayerAccessor = require('./model/player-accessor.js');

const WebServerSpectator = require('./local-web-ui/web-server-spectator.js');

const ExampleResourceLoader = require('./model/example-resource-loader.js');

const main = async () => {
  const spectator = new WebServerSpectator();
  await spectator.init();
  
  const resourceLoader = new ExampleResourceLoader();
  await resourceLoader.init();
  await resourceLoader.setGame('guess100');
  
  const playerSandboxes = [];
  
  const playerAccessor = new PlayerAccessor();
  
  playerAccessor.getPlayerCollection = () => {
    return playerSandboxes;
  };
  
  playerAccessor.createPlayer = async () => {
    const playerSandbox = new PlayerPuppeteerSandbox();
    playerSandboxes.push(playerSandbox);
    playerSandbox.playernum = playerSandboxes.length;
    console.log(`Launching player ${playerSandbox.playernum}!`);
    
    await playerSandbox.init();

    // Load the player's script.
    // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
    playerSandbox.script = await resourceLoader.loadPlayerScript();
        
    // Load the player's long-term memory.
    // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
    try {
      ltmJSON = await resourceLoader.loadPlayerLongTermMemory();
      ltmObj = JSON.parse(ltmJSON);
      playerSandbox.myLongTermMemory = ltmObj;
    } catch(err) {
      // It's not really a big deal if we can't load the player's long-term memory,
      // but it does probably mean that there's something wrong with our framework.
      console.warn(err);
    }    
    
    // TODO: Connect the player sandbox to the spectator.
    playerSandbox.onTaunt = async (tauntMsg) => {
      await spectator.receiveTaunt(playerSandbox.playernum, tauntMsg);
    };
    
    return playerSandbox;
  };
  
  const arenaSandbox = new ArenaPuppeteerSandbox();
  await arenaSandbox.init();
  
  arenaSandbox.playerAccessor = playerAccessor;
  
  // Load the arena script.
  // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
  arenaSandbox.script = await resourceLoader.loadArenaScript();
  spectator.resources = await resourceLoader.loadSpectatorResources(spectator.getSpectatorResourceType());
  
  arenaSandbox.updateSpectator = async (spectatorParams) => {
    await spectator.receiveUpdate(spectatorParams);
  };

  // --------------------
  // RUN THE GAME!!!
  //
  console.log('Launching the arena!');
  await arenaSandbox.run();

  // --------------------
  // Handle endgame
  
  console.log('Arena has completed. Waiting for players to complete.');
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
          console.log(`  [X] Player ${psbx.playernum}: ${psbx.id}`);
        });
    playerShutdownPromises.push(playerShutdownPromise);
  }
  await Promise.allSettled(playerShutdownPromises);
  
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
  
  console.log('Awaiting spectator shutdown.');
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


