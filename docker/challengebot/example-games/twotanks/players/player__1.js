
while (true) {
  // Go forward.
  taunt('Advance');
  await action({
    type: 'move',
    strength: 5,
    duration: 1
  });

  // Turn right
  taunt('Turn');
  await action({
    type: 'turn',
    strength: 5,
    duration: 1
  });

  const s = await sensors();
  if (s.distanceToEnemy) {
    // If we're facing the enemy, charge!
    taunt('Charge!');
    await action({
      type: 'move',
      strength: 10,
      duration: 2
    });
  } else {
    taunt('Crawl...');
    // Turn and crawl.
    await action({
      type: 'turn',
      strength: 1,
      duration: 1
    });
    await action({
      type: 'move',
      strength: 2,
      duration: 1
    });
  }
}
