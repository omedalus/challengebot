
ChallengeBot.taunt(`I'll get you sooner or later!`);

if (!ChallengeBot.myLongTermMemory || !ChallengeBot.myLongTermMemory.startingNumber) {
  ChallengeBot.myLongTermMemory = {
    startingNumber: 1
  };
}
guess = ChallengeBot.myLongTermMemory.startingNumber;

let longstring = 'foo';
while (true) {
  console.log(`I'm going to guess ${guess}`);
  const isResultGood = await ChallengeBot.action(guess);
  console.log(`I guessed ${guess}. Result: ${isResultGood}`);
  
  if (isResultGood) {
    ChallengeBot.taunt('I got it!');
    
    // Next time, start at this number!
    ChallengeBot.myLongTermMemory.startingNumber = guess;
    break;
  }
  
  //const sleepdur = guess * 250;
  //console.log(`I think hard now. ${sleepdur} ms`);
  //await ChallengeBot.sleep(sleepdur);
  
  guess++;
  guess %= 100;
  if (guess === 0) {
    guess++;
  }
}

console.log('And now I spin forever.');
//await sleep(50000);
while(true) {}
