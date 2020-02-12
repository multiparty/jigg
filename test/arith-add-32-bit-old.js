'use strict';

const assert = require('assert');
const Process = require('./process.js');

const inputCount = 20;

describe('Random inputs (regular server): arith-add-32-bit-old.txt', function () {
  let serverProcess;
  before(function () {
    serverProcess = new Process('node', ['demo/server.js']);
  });

  for (let i = 0; i < inputCount; i++) {
    const garblerInput = Math.floor(Math.random() * Math.pow(2, 20));
    const evaluatorInput = Math.floor(Math.random() * Math.pow(2, 20));
    const expectedOutput = garblerInput + evaluatorInput;

    it('Inputs ' + garblerInput + ' ' + evaluatorInput, async function () {
      const garbler = new Process('node', ['demo/party.js', 'Garbler', garblerInput, 'number', 'arith-add-32-bit-old.txt', 'false']);
      const evaluator = new Process('node', ['demo/party.js', 'Evaluator', evaluatorInput, 'number', 'arith-add-32-bit-old.txt', 'false']);
      const data = await Promise.all([garbler.promise(), evaluator.promise()]);

      assert.deepEqual(data[0], data[1]);
      assert.equal(data[0].length, 1);
      assert.equal(data[0][0].trim(), expectedOutput);
    });
  }

  after(function () {
    serverProcess.kill();
    return serverProcess.promise();
  });
});