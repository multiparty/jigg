'use strict';

const assert = require('assert');
const Process = require('./process.js');

describe('AES128 Encryption Evaluating Server', function () {
  const inputs = [
    {key: '00010203050607080A0B0C0D0F101112', plaintext: '506812A45F08C889B97F5980038B8359'}
  ];
  const outputs = [
    'DDB5D845BD63EB36F3821BDC8F9D686C'
  ];

  for (let i = 0; i < inputs.length; i++) {
    const expectedOutput = outputs[i].toUpperCase();
    const garblerInput = inputs[i].plaintext.toUpperCase();
    const evaluatorInput = inputs[i].key.toUpperCase();

    it('Input ' + i, async function () {
      // run garbling server
      const garbler = new Process('node', ['demo/server.js', '3001', 'Evaluator', evaluatorInput, 'hex', 'aes-128-ecb-encrypt.txt', 'false']);
      // run evaluator party
      const evaluator = new Process('node', ['demo/party.js', '3001', 'Garbler', garblerInput, 'hex', 'aes-128-ecb-encrypt.txt', 'false']);

      // read output
      const evaluatorOutput = await evaluator.promise();

      // kill garbling server and read output
      garbler.kill();
      const garblerOutput = (await garbler.promise()).slice(1);

      assert.deepEqual(evaluatorOutput, garblerOutput);
      assert.equal(evaluatorOutput.length, 1);
      assert.equal(evaluatorOutput[0].trim(), expectedOutput);
    });
  }
});
