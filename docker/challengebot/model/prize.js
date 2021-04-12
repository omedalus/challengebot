
/**
 * Describes something that a player won over the course of a game.
 * Can be simply a designation like "Winner", an achievement like 
 * "Most Valuable Player", or a value like "Number of yards run."
 */
 
class Prize {
  // A label of what this prize is. E.g. "Winner" or "MVP".
  label = '';
  
  // A short blurb explaining what this prize means.
  description = '';
  
  // Tells whether or not the prize is merely a designation,
  // such as "Winner", or whether there's an amount associated with it.
  isNumeric = false;
  
  // For prizes that have an amount, this is how much prize was won.
  // E.g. for "Number of yards run", this is the number of yards run.
  amount = 1;
  
  // Some prizes that have an amount, also have a max achievable amount
  // of that thing. For example, in a game about exploring a map,
  // a player could be awarded a prize based on the number of areas explored.
  // However, if the game only has ten areas, then the player should know
  // that they explored all ten.
  amountOutOf = 0;
  
  // What percent of the total possible amount the player received.
  // Returns an integer between 0 and 100, inclusive. If amountOutOf
  // is not set, or if isNumeric is false, then automatically returns 100.
  get amountPercent() {
    if (!this.isNumeric) {
      return 100;
    }
    if (!this.amountOutOf) {
      return 100;
    }
    if (!this.amount) {
      return 0;
    }
    const pct = Math.ceil(100 * this.amount / this.amountOutOf);
    return pct;        
  }
  
  constructor(labelOrObj, arg1, arg2, arg3) {
    let assignObj = {};
    if (typeof labelOrObj === 'object') {
      assignObj = labelOrObj;
    } else if (typeof labelOrObj === 'string') {
      assignObj.label = labelOrObj;
    } else {
      throw new TypeError(`Not sure what to do with argument "${labelOrObj}" of type ${typeof labelOrObj} in Prize constructor.`);
    }
    
    if (typeof arg1 === 'string') {
      assignObj.description = arg1;
    } else if (typeof arg1 === 'number') {
      assignObj.amount = arg1;
    }
    
    if (typeof arg2 === 'string') {
      assignObj.description = arg2;
    } else if (typeof arg2 === 'number') {
      assignObj.amountOutOf = arg2;
    }

    if (typeof arg3 === 'string') {
      assignObj.description = arg3;
    }
    
    if ('amountOutOf' in assignObj && !('amount' in assignObj)) {
      throw new TypeError('Cannot define "amountOutOf" without defining "amount".');
    }
    if ('amount' in assignObj) {
      assignObj.isNumeric = true;
    }
    
    if (!assignObj.label) {
      throw new TypeError('Cannot create an unlabeled prize.');
    }
    
    Object.assign(this, assignObj);
  }
  
  
  toString() {
    if (!this.isNumeric) {
      return this.label;
    }
    let s = `${this.label}: ${this.amount}`;
    if (this.amountOutOf) {
      s += ` of ${this.amountOutOf} (${this.amountPercent}%)`;
    }
    return s;
  }
}

module.exports = Prize;




















