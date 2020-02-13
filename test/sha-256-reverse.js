'use strict';

const assert = require('assert');
const Process = require('./process.js');

describe('SHA256 Garbling Server', function () {
  const inputs = [
    '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    '243f6a8885a308d313198a2e03707344a4093822299f31d0082efa98ec4e6c89452821e638d01377be5466cf34e90c6cc0ac29b7c97c50dd3f84d5b5b5470917',
  ];
  const outputs = [
    'da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8',
    'fc99a2df88f42a7a7bb9d18033cdc6a20256755f9d5b9a5044a9cc315abe84a7',
    'ef0c748df4da50a8d6c43c013edc3ce76c9d9fa9a1458ade56eb86c0a64492d2',
    'cf0ae4eb67d38ffeb94068984b22abde4e92bc548d14585e48dca8882d7b09ce',
  ];

  for (let i = 0; i < inputs.length; i++) {
    const expectedOutput = outputs[i].toUpperCase();
    const garblerInput = inputs[i].substring(0, 64).toUpperCase();
    const evaluatorInput = inputs[i].substring(64).toUpperCase();

    it('Input ' + i, async function () {
      // run garbling server
      const garbler = new Process('node', ['demo/server.js', '3001', 'Garbler', garblerInput, 'hex', 'sha-256-reverse.txt', 'false']);
      // run evaluator party
      const evaluator = new Process('node', ['demo/party.js', '3001', 'Evaluator', evaluatorInput, 'hex', 'sha-256-reverse.txt', 'false']);

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