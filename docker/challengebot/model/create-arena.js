
const createArena = async (arenaJS) => {
  const browserArena = await puppeteer.launch({
    headless: true
  });
  const pageArena = await browserGameMaster.newPage();

  const playerObj = {
    puppeteerBrowser: browserPlayer,
    puppeteerPage: pagePlayer,
    script: '',
    actionPromiseResolve: null,
    actionParams: null,
    sensorReadings: null,
    taunt: null
  };


  return;

  const setupPlayer = async (playernum) => {
    const browserPlayer = await puppeteer.launch({
      // Obviously we'll want to run headless in practice,
      // but for now it's useful to open a window and follow along.
      headless: false
    });
    const pagePlayer = await browserPlayer.newPage();

    const playerObj = {
      puppeteerBrowser: browserPlayer,
      puppeteerPage: pagePlayer,
      script: '',
      actionPromiseResolve: null,
      actionParams: null,
      sensorReadings: null,
      taunt: null
    };

    await pagePlayer.exposeFunction('sensors', () => {
      return Promise.resolve(playerObj.sensorReadings);
    });

    await pagePlayer.exposeFunction('taunt', (taunt) => {
      if (typeof taunt === 'string') {
        playerObj.taunt = taunt;
      }
      return Promise.resolve(playerObj.taunt);
    });

    await pagePlayer.exposeFunction('action', (actionParams) => {
      // TODO: Ensure that the structure is proper and that the player
      // isn't trying to do something evil.
      const p = new Promise((resolve, reject) => {
        if (playerObj.actionPromiseResolve !== null) {
          reject('Previous action is still in progress.');
        }
        playerObj.actionParams = actionParams;
        playerObj.actionPromiseResolve = resolve;
      });
      return p;
    });

    // Inject the player's code.
    // NOTE: Do not perform an await on evaluate! We have no reason to wait around
    // for the player to be ready. If they want to burn through their CPU cycles
    // in an idle loop, that's their problem.
    const jsPlayer = fs.readFileSync(`./tankgame/player__${playernum}.js`, {encoding: 'utf-8'});
    playerObj.script = jsPlayer;
    pagePlayer.evaluate(`(async () => { ${jsPlayer} })()`);

    return playerObj;
  };


  const players = [
    await setupPlayer(0),
    await setupPlayer(1)
  ];


  await pageGameMaster.exposeFunction('setPlayerSensors', (playernum, sensorReadings) => {
    const p = new Promise((resolve, reject) => {
      try {
        players[playernum].sensorReadings = sensorReadings;
      } catch (err) {
        reject(err);
      }
      resolve();
    });
    return p;
  });

  await pageGameMaster.exposeFunction('notifyPlayerLastActionCompleted', (playernum, sensorReadings) => {
    const p = new Promise((resolve, reject) => {
      try {
        const player = players[playernum];
        // If sensor readings were provided, update the player's sensors here.
        if (typeof sensorReadings !== 'undefined') {
          player.sensorReadings = sensorReadings;
        }
        if (player.actionPromiseResolve) {
          const fnResolve = player.actionPromiseResolve;
          player.actionPromiseResolve = null;
          fnResolve(sensorReadings);
        }
      } catch (err) {
        reject(err);
      }
      resolve();
    });
    return p;
  });

  await pageGameMaster.exposeFunction('getPlayerAction', (playernum) => {
    try {
      const player = players[playernum];
      return Promise.resolve(player.actionParams);
    } catch (err) {
      return Promise.reject(err);
    }
  });

  await pageGameMaster.exposeFunction('getPlayerTaunt', (playernum) => {
    try {
      const player = players[playernum];
      if (player) {
        return Promise.resolve(player.taunt);
      }
      return null;
    } catch (err) {
      return Promise.reject(err);
    }
  });


  // Inject the master script and run the game!
  const jsGameMaster = fs.readFileSync('./tankgame/master.js', {encoding: 'utf-8'});
  await pageGameMaster.evaluate(`(async () => { ${jsGameMaster} })()`);
}



main()



