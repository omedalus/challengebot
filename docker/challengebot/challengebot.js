const fs = require('fs');

const ArenaPuppeteerSandbox = require('./model/arena-puppeteer-sandbox.js');
const PlayerPuppeteerSandbox = require('./model/player-puppeteer-sandbox.js');
const PlayerAccessor = require('./model/player-accessor.js');

const EXAMPLE_GAME_PATH = './example-games/guess100';

const main = async () => {
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
    playerSandbox.script = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/players/player__${playerSandbox.playernum}.js`, 
        {encoding: 'utf-8'});
        
    // Load the player's long-term memory.
    // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
    try {
      ltmJSON = fs.readFileSync(
          `${EXAMPLE_GAME_PATH}/players/ltm__${playerSandbox.playernum}.json`,
          {encoding: 'utf-8'});
      playerSandbox.myLongTermMemory = JSON.parse(ltmJSON);
    } catch(err) {
      // It's not really a big deal if we can't load the player's long-term memory,
      // but it does probably mean that there's something wrong with our framework.
      console.warn(err);
    }    
    
    // TODO: Connect the player sandbox to the spectator.
    return playerSandbox;
  };
  
  const arenaSandbox = new ArenaPuppeteerSandbox();
  await arenaSandbox.init();
  
  arenaSandbox.playerAccessor = playerAccessor;
  
    // Load the arena script.
    // IRL, this will be loaded from a DB, or from a local file specified on the commandline.
  arenaSandbox.script = fs.readFileSync(
      `${EXAMPLE_GAME_PATH}/arena/arena.js`, 
      {encoding: 'utf-8'});
  
  arenaSandbox.updateSpectator = async (spectatorParams) => {
    console.log('We dont have a spectator yet, but if we did he would hear:');
    console.log(spectatorParams);
  };

  // --------------------
  // RUN THE GAME!!!
  //
  console.log('Launching the arena!');
  await arenaSandbox.run();

  // --------------------
  // Handle endgame
  
  console.log('Arena has completed. Waiting for players to complete.');
  // We can do this serially, because they're all already running.
  // They should be already waiting on us to check on them.
  for (let psbx of playerSandboxes) {
    await psbx.ensureTimedShutdown(10 * 1000);
    console.log(`  [X] Player ${psbx.playernum}: ${psbx.id}`);
  }
  
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
        console.log('  Died in disgrace. Gains no loot and learns nothing. Error:');
        console.log(psbx.error);
        return;
      }
      console.log(`  Received loot:`);
      // TODO: List loot here.

      console.log('  And what did we learn from this?');
      console.log(psbx.myLongTermMemory);

      console.log('  Writing player results to DB...');
      // TODO: Do that.
      console.log('  ...Done.');
    };
    console.log('\n\n');  
  }
};


(async () => {
  await main();
  // Ensure that we exit, even if there are still timeouts lingering.
  process.exit();  
})();


