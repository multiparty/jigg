// Wrapper around Uint8Arrays

'use strict';

function Label(bytes) {
  this.bytes = bytes;
}

Label.prototype.xor = function (label2) {
  return this.xorBytes(label2.bytes);
};

Label.prototype.xorBytes = function (bytes2) {
  const bytes = this.bytes.slice();

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = bytes[i] ^ bytes2[i];
  }

  return new Label(bytes);
};

Label.prototype.double = function () {
  const bytes = this.bytes.slice();
  const leastbyte = bytes[0];
  bytes.copyWithin(0,1,15);  // Logical left shift by 1 byte
  bytes[14] = leastbyte;  // Restore old least byte as new greatest (non-pointer) byte
  return new Label(bytes);
};

Label.prototype.quadruple = function () {
  const bytes = this.bytes.slice();
  const leastbytes = [bytes[0], bytes[1]];
  bytes.copyWithin(0,2,15);  // Logical left shift by 2 byte
  [bytes[13], bytes[14]] = leastbytes;  // Restore old least two bytes as new greatest bytes
  return new Label(bytes);
};

Label.prototype.getPoint = function () {
  return this.bytes[15] & 0x01;
};

Label.prototype.setPoint = function (point) {
  if (point === 0) {
    this.bytes[15] = this.bytes[15] & 0xFE;
  } else {
    this.bytes[15] = this.bytes[15] | 0x01;
  }
};

Label.prototype.equals = function (label2) {
  if (this.bytes.length !== label2.bytes.length) {
    return false;
  }

  for (let i = 0; i < this.bytes.length; i++) {
    if (this.bytes[i] !== label2.bytes[i]) {
      return false;
    }
  }

  return true;
};

Label.prototype.isZero = function () {
  for (let i = 0; i < this.bytes.length; i++) {
    if (this.bytes[i] !== 0) {
      return false;
    }
  }

  return true;
};

Label.prototype.serialize = function () {
  const arr = [];
  for (let i = 0; i < this.bytes.length; i++) {
    arr[i] = String.fromCharCode(this.bytes[i]);
  }

  return arr.join('');
};

module.exports = Label;