
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
  
  const sleepdur = 2500;
  ChallengeBot.taunt(`I think hard now. ${sleepdur} ms`);
  await ChallengeBot.sleep(sleepdur);
  
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

// Verify that we've blocked network access.
ChallengeBot.taunt('Oh hey guess what. Do I have network access?');
url = 'https://app.launchdarkly.com/sdk/evalx/5de987f2f45cae087e7c6dbb/users/eyJhbm9ueW1vdXMiOnRydWUsImtleSI6Im5vbi11c2VyIn0';
try {
  const response = await fetch(url, {method: 'get'});
  const json = await response.json();
  ChallengeBot.taunt('Ha ha check out what I can see!');
  ChallengeBot.taunt(JSON.stringify(json));  
} catch (err) {
  ChallengeBot.taunt('Never mind, I can\'t send an XHR. ');
}

ChallengeBot.taunt('Okay but I bet I can connect to a WebSocket...');
try {
  ws = new WebSocket('ws://localhost:3210', 'json');
  await ChallengeBot.sleep(1000);
  ws.send('foo');
  ChallengeBot.taunt('Ha ha I totally did connect on a WebSocket!');  
} catch (err) {
  ChallengeBot.taunt('Never mind, I can\'t open and send on a WebSocket.');
}

ChallengeBot.taunt('Okay but what about RTC...');
try {
  rtc = new RTCPeerConnection();
  ChallengeBot.taunt('Ha ha I can totally create an RTCPeerConnection object!');  
} catch (err) {
  ChallengeBot.taunt('Never mind, I can\'t create an RTCPeerConnection object.');
}


ChallengeBot.taunt('And now I spin.');
await ChallengeBot.sleep(5000);
