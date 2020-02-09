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

Circuit.prototype.evaluate = function (garblerInput, evaluatorInput) {
  if (garblerInput.length !== this.garblerInputSize) {
    throw new Error('Garbler input has wrong size');
  }
  if (evaluatorInput.length !== this.evaluatorInput) {
    throw new Error('Evaluator input has wrong size');
  }

  let assignment = garblerInput.concat(evaluatorInput);

  for (let i = 0; i < this.gates.length; i++) {
    this.gates[i].evaluate(assignment);
  }

  return assignment.slice(this.wiresCount - this.outputSize - 1);
};

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