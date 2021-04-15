
console.log('The script is running!');

window.addEventListener('message', (ev) => {
  const el = document.getElementById('lastmessage');
  el.innerText = JSON.stringify(ev.data);
  console.log(ev);
}, false);


