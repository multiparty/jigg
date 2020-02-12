// Describes both garbled and plain gates

'use strict';

function Gate(id, operation, inputWires, outputWire, truthTable) {
  this.id = id;
  this.operation = operation;
  this.inputWires = inputWires;
  this.outputWire = outputWire;
  this.truthTable = truthTable;
}

Gate.prototype.serialize = function () {
  let gateStr = [];

  if (this.operation === 'AND') {
    gateStr.push('&');
  } else if (this.operation === 'XOR') {
    gateStr.push('^');
  } else if (this.operation === 'INV') {
    gateStr.push('!');
  }

  gateStr.push(this.id);
  gateStr.push(JSON.stringify(this.inputWires));
  gateStr.push(this.outputWire);

  if (this.operation === 'AND') {
    gateStr.push('-');
    for (let i = 0; i < this.truthTable.length; i++) {
      gateStr.push(this.truthTable[i].serialize());
    }
  }

  return gateStr.join('');
};

module.exports = Gate;