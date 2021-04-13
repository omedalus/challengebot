
/**
 * The web server communicates with its client via a series of JSON messages.
 * These messages have the following structure:
 * {
 *   message_num: <this message's number, starting with 1>
 *   message_count: <the total number of messages received so far>
 *   message_type: <'ui' or 'taunt'>
 *   player: <for taunts, >
 *   
 */
 
class WebServerSpectatorMessage {
  // This message's sequence number, starting with 1.
  message_num = 0;
  
  // The total number of messages received by the spectator so far.
  // Unset (or set to 0) while the message is stored. Gets set when
  // the message is transmitted.
  message_count = 0;
  
  // 'ui' or 'taunt'.
  message_type = '';
  
  // For taunts, this is the number of the player who sent it.
  player = 0;
  
  // The number of milliseconds of wallclock time since the game
  // was started, when this message was received. The game's wallclock
  // time starts when the first message is received, so the first
  // message always has gametime_ms=0;
  gametime_ms = 0;
  
  // The data associated with this message.
  data = {};
};

module.exports = WebServerSpectatorMessage;

