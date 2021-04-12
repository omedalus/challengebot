
ChallengeBot.taunt(`I'll get you sooner or later!`);

if (!ChallengeBot.myLongTermMemory || !ChallengeBot.myLongTermMemory.startingNumber) {
  ChallengeBot.myLongTermMemory = {
    startingNumber: 1
  };
}
guess = ChallengeBot.myLongTermMemory.startingNumber;

let longstring = 'foo';
while (true) {
  ChallengeBot.taunt(`I'm going to guess ${guess}`);
  const isResultGood = await ChallengeBot.action(guess);
  ChallengeBot.taunt(`I guessed ${guess}. Result: ${isResultGood}`);
  
  if (isResultGood) {
    ChallengeBot.taunt('I got it!');
    
    // Next time, start at this number!
    ChallengeBot.myLongTermMemory.startingNumber = guess;
    break;
  }
  
  //const sleepdur = guess * 250;
  //ChallengeBot.taunt(`I think hard now. ${sleepdur} ms`);
  //await ChallengeBot.sleep(sleepdur);
  
  guess++;
  guess %= 100;
  if (guess === 0) {
    guess++;
  }
}


await ChallengeBot.gameOver();
const prizes = await ChallengeBot.prizes();

ChallengeBot.taunt('Look at what I won!');
ChallengeBot.taunt(JSON.stringify(prizes));

ChallengeBot.taunt('And now I spin.');
await ChallengeBot.sleep(10000);
