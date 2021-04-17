/**
 * Invoked when an arena script does something wrong.
 */
 
class ArenaError extends Error {
  constructor(message) {
    super(message);
    this.name = "ArenaError";
  }
};

module.exports = ArenaError;
