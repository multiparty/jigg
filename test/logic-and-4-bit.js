'use strict';

const assert = require('assert');
const Process = require('./process.js');

describe('Exhaustive regular server: logic-and-4-bit.txt', function () {
  let serverProcess;
  before(function () {
    serverProcess = new Process('node', ['demo/server.js', '3001']);
  });

  const inputs = ['00', '01', '10', '11'];
  for (let i = 0; i < inputs.length; i++) {
    for (let j = 0; j < inputs.length; j++) {
      const expectedOutput = (i === 3 && j === 3) ? '[ 1 ]' : '[ 0 ]';
      const garblerInput = inputs[i];
      const evaluatorInput = inputs[j];

      it('Inputs ' + garblerInput + ' ' + evaluatorInput, async function () {
        const garbler = new Process('node', ['demo/party.js', '3001', 'Garbler', garblerInput, 'bits', 'logic-and-4-bit.txt', 'false']);
        const evaluator = new Process('node', ['demo/party.js', '3001', 'Evaluator', evaluatorInput, 'bits', 'logic-and-4-bit.txt', 'false']);
        const data = await Promise.all([garbler.promise(), evaluator.promise()]);

        assert.deepEqual(data[0], data[1]);
        assert.equal(data[0].length, 1);
        assert.equal(data[0][0].trim(), expectedOutput);
      });
    }
  }

  after(function () {
    serverProcess.kill();
    return serverProcess.promise();
  });
});