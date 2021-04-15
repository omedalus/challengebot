
let lastMsgNum = 0;

const getMessages = () => {
  fetch(`../messages/since/${lastMsgNum}`).then((response) => {
    response.json().then((msgs) => {
      const iframeElem = document.getElementById('arenaview');
      if (iframeElem) {
        msgs.forEach((msg) => {
          iframeElem.contentWindow.postMessage(msg, '*');
        });
      } else {
        // TODO: Save the messages up for when the iframe
        // does in fact appear.
      }
      
      if (msgs && msgs.length) {
        lastMsg = msgs[msgs.length - 1];
        lastMsgNum = lastMsg.message_num;
      }
      getMessages();
    });  
  });
};

// Put this on a delay so the iframe has time to load.
setTimeout(getMessages, 1000);
