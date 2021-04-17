
console.log('The script is running!');

window.addEventListener('message', (ev) => {
  const el = document.getElementById('lastmessage');
  el.innerText = JSON.stringify(ev.data);
  
  if (ev.data.message_type === 'taunt') {
    document.getElementById('taunt').innerText = ev.data.data;
  } else {
    if (ev.data.data_type === 'string') {
      document.getElementById('arenamsg').innerText = ev.data.data_string;
    }
    if ('goal' in ev.data.data_object) {
      document.getElementById('goal').innerText = ev.data.data_object.goal;
    }
    if ('numGuessesPermitted' in ev.data.data_object) {
      document.getElementById('remaining').innerText = ev.data.data_object.numGuessesPermitted;
    }
  }
}, false);


