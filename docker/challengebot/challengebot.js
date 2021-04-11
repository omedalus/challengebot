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
    
    await playerSandbox.init();

    playerSandbox.script = fs.readFileSync(
        `${EXAMPLE_GAME_PATH}/players/player__${playerSandbox.playernum}.js`, 
        {encoding: 'utf-8'});    
    
    // TODO: Connect the player sandbox to the spectator.
    return playerSandbox;
  };
  
  const arenaSandbox = new ArenaPuppeteerSandbox();
  await arenaSandbox.init();
  
  arenaSandbox.playerAccessor = playerAccessor;
  
  arenaSandbox.script = fs.readFileSync(
      `${EXAMPLE_GAME_PATH}/arena/arena.js`, 
      {encoding: 'utf-8'});
  
  arenaSandbox.updateSpectator = async (spectatorParams) => {
    console.log('We dont have a spectator yet, but if we did he would hear:');
    console.log(spectatorParams);
  };
  
  // We  await this because we want to be able to have the option
  // of cleaning up nicely later.
  await arenaSandbox.run();
};

main();
