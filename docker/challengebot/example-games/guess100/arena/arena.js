
ChallengeBot.updateSpectator('Creating player');

const playerNum = await ChallengeBot.requestPlayer();

ChallengeBot.updateSpectator('Player number ' + playerNum + ' has arrived.');


ChallengeBot.updateSpectator('Starting game.');
await ChallengeBot.startGame();

const goal = Math.ceil(Math.random() * 100);

ChallengeBot.updateSpectator(`I'm thinking of a number. It's ${goal}.`);

let numGuessesPermitted = 101;
while (true) {
  numGuessesPermitted--;
  ChallengeBot.updateSpectator(`${numGuessesPermitted} guesses remaining.`);
  if (numGuessesPermitted <= 0) {
    break;
  }
  
  const playerGuess = await ChallengeBot.getPlayerAction(playerNum);
  ChallengeBot.updateSpectator(`Player has guessed ${JSON.stringify(playerGuess)}`);
  
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

