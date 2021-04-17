
ChallengeBot.updateSpectator('Creating player');

const playerNum = await ChallengeBot.requestPlayer();

await ChallengeBot.updateSpectator('Player number ' + playerNum + ' has arrived.');

try {
  // See what happens when we request an action from a player who doesn't exist.
  const noSuchPlayerGuess = await ChallengeBot.getPlayerAction(66);
} catch (err) {
  await console.log(`Lol just kidding. I know there's no Player ${err.playernum}.`);
  await ChallengeBot.sleep(10000);
}


ChallengeBot.updateSpectator('Starting game.');
await ChallengeBot.startGame();

const goal = Math.ceil(Math.random() * 100);

await ChallengeBot.updateSpectator({goal});

let numGuessesPermitted = 101;
while (true) {
  numGuessesPermitted--;
  ChallengeBot.updateSpectator({goal, numGuessesPermitted});
  console.log(`Only ${numGuessesPermitted} guesses left.`);
  if (numGuessesPermitted <= 0) {
    break;
  }
  
  let playerGuess = null;
  try {
    playerGuess = await ChallengeBot.requirePlayerAction(playerNum, 2000);
  } catch (err) {
    if (err.playernum) {
      await ChallengeBot.updateSpectator(`Player ${err.playernum} didn't respond in time. He's out!`);
      await ChallengeBot.awardPlayerPrize(err.playernum, "Indecisive", 'Failed to come up with a guess in time.');
      await ChallengeBot.removePlayer(err.playernum);
      break;
    } else {
      await ChallengeBot.updateSpectator(JSON.stringify(err));
      await ChallengeBot.sleep(10000);
    }
  }
  
  ChallengeBot.updateSpectator({goal, numGuessesPermitted, playerGuess});
  
  const isGuessCorrect = (playerGuess === goal);
  
  await ChallengeBot.notifyPlayerActionCompleted(playerNum, isGuessCorrect);
  
  if (isGuessCorrect) {
    await ChallengeBot.updateSpectator('Victory!');
    await ChallengeBot.awardPlayerPrize(playerNum, "Winner", numGuessesPermitted, 100, `Won with ${numGuessesPermitted} guesses remaining.`);
    break;
  }
  
  
  ChallengeBot.updateSpectator('Trying again.');
  await ChallengeBot.sleep(100);
}

