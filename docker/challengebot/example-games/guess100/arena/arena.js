
console.log('Creating player');

const playerNum = await ChallengeBot.requestPlayer();

console.log('Player number ' + playerNum + ' has arrived.');


console.log('Waiting for 10 sec.');
await ChallengeBot.sleep(10000);

console.log('Starting game.');
await ChallengeBot.startGame();

const goal = Math.ceil(Math.random() * 100);

console.log(`I'm thinking of a number. It's ${goal}.`);

while (true) {
  const playerGuess = await ChallengeBot.getPlayerAction(playerNum);
  console.log(`Player has guessed ${JSON.stringify(playerGuess)}`);
  
  const isGuessCorrect = (playerGuess === goal);
  
  await ChallengeBot.notifyPlayerActionCompleted(playerNum, isGuessCorrect);
  
  if (isGuessCorrect) {
    console.log('Victory!');
    break;
  }
  
  console.log('Trying again.');
  await ChallengeBot.sleep(1000);
}

