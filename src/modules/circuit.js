// Describes both garbled and plain circuits

'use strict';

function Circuit(wiresCount, garblerInputSize, evaluatorInputSize, outputSize, labelSize) {
  this.wiresCount = wiresCount;
  this.garblerInputSize = garblerInputSize;
  this.evaluatorInputSize = evaluatorInputSize;
  this.outputSize = outputSize;
  this.labelSize = labelSize;

  this.gates = [];
}

Circuit.prototype.serialize = function () {
  const meta = JSON.stringify([
    this.wiresCount,
    this.garblerInputSize,
    this.evaluatorInputSize,
    this.outputSize,
    this.labelSize,
    this.gates.length
  ]);

  const gates = this.gates.map(function (gate) {
    return gate.serialize();
  });
  gates.unshift(meta);

  return gates.join('');
};

module.exports = Circuit;