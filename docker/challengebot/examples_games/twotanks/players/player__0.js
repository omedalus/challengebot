
while (true) {
  const a = {
    type: (Math.random() * 2) > 1 ? 'move' : 'turn',
    strength: .5 + (Math.random() * 5),
    duration: (Math.random() * 5)
  };
  console.log('Committing action: ' + JSON.stringify(a));
  await taunt(`I do a dance for ${a.duration} seconds`);
  const actionResult = await action(a);
  console.log('Action result: ' + JSON.stringify(actionResult));

  console.log('Sensors now read: ');
  console.log(await sensors());
}
