
ChallengeBot.updateSpectator('Creating player');

const playerNum = await ChallengeBot.requestPlayer();

ChallengeBot.updateSpectator('Player number ' + playerNum + ' has arrived.');


ChallengeBot.updateSpectator('Starting game.');
await ChallengeBot.startGame();

const goal = Math.ceil(Math.random() * 100);

ChallengeBot.updateSpectator({goal});

let numGuessesPermitted = 101;
while (true) {
  numGuessesPermitted--;
  ChallengeBot.updateSpectator({goal, numGuessesPermitted});
  if (numGuessesPermitted <= 0) {
    break;
  }
  
  const playerGuess = await ChallengeBot.requirePlayerAction(playerNum, 10000);
  ChallengeBot.updateSpectator({goal, numGuessesPermitted, playerGuess});
  
  const isGuessCorrect = (playerGuess === goal);
  
  await ChallengeBot.notifyPlayerActionCompleted(playerNum, isGuessCorrect);
  
  if (isGuessCorrect) {
    ChallengeBot.updateSpectator('Victory!');
    ChallengeBot.awardPlayerPrize(playerNum, "Winner", numGuessesPermitted, 100, `Won with ${numGuessesPermitted} guesses remaining.`);
    break;
  }
  
  
  ChallengeBot.updateSpectator('Trying again.');
  await ChallengeBot.sleep(100);
}

