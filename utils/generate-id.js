
const NUM_DEC_DIGITS = 6;
const B62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const rollMin = Math.pow(10, NUM_DEC_DIGITS - 1);
const rollMax = Math.pow(10, NUM_DEC_DIGITS) - 1;
const rollResult = Math.floor((rollMax - rollMin) * Math.random()) + rollMin;

const timestampStr = `${Date.now()}`;
const numstr = `${rollResult}${timestampStr}`;

const parseBigIntToBase = (decimalstr, tobase) => {
  let n = BigInt(decimalstr);
  let b = BigInt(tobase);
  let s = '';
  while (n > 0) {
    let ndiv = (n / b);
    let remainder = n - (ndiv * b);
    s = B62_ALPHABET[remainder] + s;
    n = ndiv;
  }
  return s;
};
const enc = parseBigIntToBase(numstr, B62_ALPHABET.length).padStart(11, 0);
console.log(enc);











/*
const digitsplit = Math.floor(Math.random() * (NUM_DEC_DIGITS + 1));


const strSplit = `${rollResult}`;
const strSplitBefore = strSplit.slice(0, digitsplit);
const strSplitAfter = strSplit.slice(digitsplit);

const strDecimal = `${digitsplit}${strSplitBefore}${Date.now()}${strSplitAfter}`;

console.log(strDecimal);
console.log(strDecimal.length);

co
const parseBigIntToBase = (decimalstr, tobase) => {
  
};

*/