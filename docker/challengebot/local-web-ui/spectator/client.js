
let lastMsgNum = 0;

const getMessages = () => {
  fetch(`../messages/since/${lastMsgNum}`).then((response) => {
    response.json().then((msgs) => {
      console.log(msgs);
      
      if (msgs && msgs.length) {
        lastMsg = msgs[msgs.length - 1];
        lastMsgNum = lastMsg.message_num;
      }
      getMessages();
    });  
  });
};
getMessages();
