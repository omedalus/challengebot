
ChallengeBot.taunt(`I'll get you sooner or later!`);
let guess = 0;
while (true) {
  // Go forward.
  console.log(`I'm going to guess ${guess}`);
  const isResultGood = await ChallengeBot.action(guess);
  console.log(`I guessed ${guess}. Result: ${isResultGood}`);
  
  const sleepdur = guess * 250;
  console.log(`I think hard now. ${sleepdur} ms`);
  await ChallengeBot.sleep(sleepdur);
  
  if (isResultGood) {
    taunt('I got it!');
    break;
  }
  
  guess++;
}
