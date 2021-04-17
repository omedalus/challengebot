
let lastMsgNum = 0;

const getMessages = () => {
  fetch(`../messages/since/${lastMsgNum}`).then((response) => {
    response.json().then((msgs) => {
      let throttleMs = 1000;
      
      if (msgs && msgs.length) {
        const iframeElem = document.getElementById('arenaview');
        msgs.forEach((msg) => {
          iframeElem.contentWindow.postMessage(msg, '*');
        });
      
        lastMsg = msgs[msgs.length - 1];
        lastMsgNum = lastMsg.message_num;
        
        throttleMs = 0;
      }
      
      setTimeout(getMessages, throttleMs);
    });  
  });
};

const waitForIframeToAppear = () => {
  const iframeElem = document.getElementById('arenaview');
  if (iframeElem) {
    getMessages();
    return;
  } else {
    setTimeout(waitForIframeToAppear, 1000);
  }
};
waitForIframeToAppear();