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

Label.prototype.getPoint = function () {
  return this.bytes[0] & 0x01;
};

Label.prototype.setPoint = function (point) {
  if (point === 0) {
    this.bytes[0] = this.bytes[0] & 0xFE;
  } else {
    this.bytes[0] = this.bytes[0] | 0x01;
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