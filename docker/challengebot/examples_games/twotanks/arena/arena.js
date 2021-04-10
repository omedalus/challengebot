class Tank {
  x = 0;
  y = 0;
  orientation = 0; // Radians. 0 = pointed "north". Goes clockwise.
  fuel = 100000;
  currentManeuverType = 'move';
  currentManeuverStrength = 100;
  currentManeuverSecondsRemaining = 0;
  taunt = '';

  constructor(x, y, orientation) {
    this.x = x;
    this.y = y;
    this.orientation = orientation;
  }

  getUnitCircleOffset() {
    return {
      x: Math.cos(this.orientation - Math.PI / 2),
      y: Math.sin(this.orientation - Math.PI / 2)
    }
  }

  determineSensorReadings(otherPlayer) {
    const sensorval = {fuel: this.fuel};

    const distToCenter = Math.hypot(otherPlayer.x - this.x, otherPlayer.y - this.y);

    const unitCircle = this.getUnitCircleOffset();
    const pointAhead = {
      x: this.x + unitCircle.x,
      y: this.y + unitCircle.y
    }
    const distToPointAhead = Math.hypot(otherPlayer.x - pointAhead.x, otherPlayer.y - pointAhead.y);
    // The other guy should be in front of us, otherwise we can't see him.
    if (distToPointAhead < distToCenter) {
      sensorval.distanceToEnemy = distToPointAhead;
    }
    return sensorval;
  }

  // Executes 1 second's worth of the current maneuver.
  executeCurrentManeuver() {
    if (this.currentManeuverSecondsRemaining < 1) {
      this.currentManeuverStrength *= this.currentManeuverSecondsRemaining;
      this.currentManeuverSecondsRemaining = 0;
    } else {
      this.currentManeuverSecondsRemaining -= 1;
    }

    const fuelConsumed = Math.ceil(Math.pow(this.currentManeuverStrength, 1.5));
    this.fuel -= fuelConsumed;
    if (this.fuel < 0) {
      this.fuel = 0;
    }

    if (this.currentManeuverType === 'turn') {
      this.orientation += this.currentManeuverStrength * .1;
      if (this.orientation < 0) {
        this.orientation += Math.PI * 2;
      } else if (this.orientation > Math.PI * 2) {
        this.orientation -= Math.PI * 2;
      }
    } else if (this.currentManeuverType === 'move') {
      const unitCircle = this.getUnitCircleOffset();
      this.x += this.currentManeuverStrength * 2 * unitCircle.x;
      if (this.x < 0) {
        this.x = 0;
      } else if (this.x > 100) {
        this.x = 100;
      }

      this.y += this.currentManeuverStrength * 2 * unitCircle.y;
      if (this.y < 0) {
        this.y = 0;
      } else if (this.y > 100) {
        this.y = 100;
      }
    }
  }
}

const buildBoard = () => {
  const boardElem = document.createElement('div');
  boardElem.id = 'board';
  boardElem.style.margin = '5vw';
  boardElem.style.width = '90vw';
  boardElem.style.height = '90vw';
  boardElem.style.border = '2px solid black';
  boardElem.style.position = 'relative';
  document.body.appendChild(boardElem);
  return boardElem;
}

const buildPlayerUI = (playernum) => {
  const boardElem = document.getElementById('board');
  const playerElem = document.createElement('div');
  playerElem.id = `playertank__${playernum}`;
  playerElem.style.position = 'absolute';
  playerElem.style.width = '9vw';
  playerElem.style.height = '9vw';
  playerElem.style.backgroundImage = 'url("https://www.clipartmax.com/png/small/77-775699_cartoon-tank-t-34-top-view-png-clipart-tank-top-view-vector.png")';
  playerElem.style.backgroundSize = 'contain';
  playerElem.style.backgroundPosition = 'center center';
  playerElem.style.backgroundRepeat = 'no-repeat';
  playerElem.style.transition = '1s linear';
  boardElem.appendChild(playerElem);

  const playerScoreboard = document.createElement('div');
  playerScoreboard.id = `playerscore__${playernum}`;
  playerScoreboard.style.position = 'relative';
  playerScoreboard.style.display = 'inline-block';
  playerScoreboard.style.border = '1px solid black';
  playerScoreboard.style.width = '20em';
  playerScoreboard.style.height = '4em';
  playerScoreboard.style.marginLeft = '2em';
  document.body.appendChild(playerScoreboard);

  const playerName = document.createElement('div');
  playerName.innerText = `Player ${playernum}`;
  playerName.style.top = '-1em';
  playerName.style.background = 'white';
  playerName.style.padding = '1ex';
  playerName.style.innerText = `Player ${playernum}`;
  playerName.style.position = 'absolute';
  playerScoreboard.appendChild(playerName);

  const playerScoreboardContent = document.createElement('div');
  playerScoreboardContent.id = `playerscore_content__${playernum}`;
  playerScoreboardContent.style.marginTop = '1em';
  playerScoreboard.appendChild(playerScoreboardContent);
}

const updateUI = () => {
  for (let iPlayer = 0; iPlayer < 2; iPlayer++) {
    const t = PLAYERS[iPlayer];
    const elem = document.getElementById(`playertank__${iPlayer}`);
    elem.style.transform = `rotate(${t.orientation}rad)`;
    elem.style.top = `${t.y * .9}%`;
    elem.style.left = `${t.x * .9}%`;

    const elemScore = document.getElementById(`playerscore_content__${iPlayer}`);
    elemScore.innerText =
      JSON.stringify(t.determineSensorReadings(PLAYERS[1 - iPlayer])) +
      ' | ' +
      t.taunt;
  }
}

const PLAYERS = [
  new Tank(10, 10, 3*Math.PI/4),
  new Tank(90, 90, -1*Math.PI/4)
];

buildBoard();
buildPlayerUI(0);
buildPlayerUI(1);
updateUI();

let iTurn = 0;
const TURN = async () => {
  iTurn++;
  console.log(`Turn ${iTurn}`);

  for (let iPlayer = 0; iPlayer < 2; iPlayer++) {
    const t = PLAYERS[iPlayer];
    t.executeCurrentManeuver();
  }

  for (let iPlayer = 0; iPlayer < 2; iPlayer++) {
    const t = PLAYERS[iPlayer];

    if (t.currentManeuverSecondsRemaining > 0) {
      // Never mind. Current maneuver still in progress.
      continue;
    }

    const sensorval = t.determineSensorReadings(PLAYERS[1 - iPlayer]);
    await notifyPlayerLastActionCompleted(iPlayer, sensorval);
    // NOTE: Optionally, we could set the sensor values explicitly with setPlayerSensors.
    // However, in this game, it makes sense to set them at the time at which the player's action
    // completes and they are ready to take stock of that action's results and perform
    // their next move.

    const a = await getPlayerAction(iPlayer);
    // TODO: Enforce boundaries and validity checks on player actions.
    t.currentManeuverType = a.type;
    t.currentManeuverStrength = a.strength;
    t.currentManeuverSecondsRemaining = a.duration;

    const taunt = await getPlayerTaunt(iPlayer);
    t.taunt = taunt;
  }

  updateUI();

  setTimeout(async () => {
    await TURN();
  }, 1000);
};
await TURN();


