'use strict';

const table16 = {
  0: '0000', 1: '0001', 2: '0010', 3: '0011',
  4: '0100', 5: '0101', 6: '0110', 7: '0111',
  8: '1000', 9: '1001', A: '1010', B: '1011',
  C: '1100', D: '1101', E: '1110', F: '1111'
};
function hex2bin(hex) {
  let bin = '';
  for (let i = 0; i < hex.length; i++) {
    bin += table16[hex[i].toUpperCase()];
  }
  return bin;
}

const table2 = {
  '0000': '0', '0001': '1', '0010': '2', '0011': '3',
  '0100': '4', '0101': '5', '0110': '6', '0111': '7',
  '1000': '8', '1001': '9', '1010': 'A', '1011': 'B',
  '1100': 'C', '1101': 'D', '1110': 'E', '1111': 'F'
};
function bin2hex(bin) {
  let hex = '';
  bin = (new Array((4-(bin.length%4))%4)).fill('0').join('') + bin;
  for (let i = 0; i < bin.length; i+=4) {
    hex += table2[bin.substr(i, 4)];
  }
  return hex;
}

module.exports = {
  bin2hex: bin2hex,
  hex2bin: hex2bin
};
