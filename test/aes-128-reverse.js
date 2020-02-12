'use strict';

const assert = require('assert');
const Process = require('./process.js');

describe('AES128 Evaluating Server', function () {
  const inputs = [
    {key: '00010203050607080A0B0C0D0F101112', plaintext: '506812A45F08C889B97F5980038B8359'},
    {key: '14151617191A1B1C1E1F202123242526', plaintext: '5C6D71CA30DE8B8B00549984D2EC7D4B'},
    {key: '28292A2B2D2E2F30323334353738393A', plaintext: '53F3F4C64F8616E4E7C56199F48F21F6'},
    {key: '3C3D3E3F41424344464748494B4C4D4E', plaintext: 'A1EB65A3487165FB0F1C27FF9959F703'},
    {key: '50515253555657585A5B5C5D5F606162', plaintext: '3553ECF0B1739558B08E350A98A39BFA'},
    {key: '64656667696A6B6C6E6F707173747576', plaintext: '67429969490B9711AE2B01DC497AFDE8'},
    {key: '78797A7B7D7E7F80828384858788898A', plaintext: '93385C1F2AEC8BED192F5A8E161DD508'},
    {key: '8C8D8E8F91929394969798999B9C9D9E', plaintext: 'B5BF946BE19BEB8DB3983B5F4C6E8DDB'}
  ];
  const outputs = [
    'D8F532538289EF7D06B506A4FD5BE9C9',
    '59AB30F4D4EE6E4FF9907EF65B1FB68C',
    'BF1ED2FCB2AF3FD41443B56D85025CB1',
    '7316632D5C32233EDCB0780560EAE8B2',
    '408C073E3E2538072B72625E68B8364B',
    'E1F94DFA776597BEACA262F2F6366FEA',
    'F29E986C6A1C27D7B29FFD7EE92B75F1',
    '131C886A57F8C2E713ABA6955E2B55B5'
  ];

  for (let i = 0; i < inputs.length; i++) {
    const expectedOutput = outputs[i].toUpperCase();
    const garblerInput = inputs[i].key.toUpperCase();
    const evaluatorInput = inputs[i].plaintext.toUpperCase();

    it('Input ' + i, async function () {
      // run garbling server
      const garbler = new Process('node', ['demo/server.js', 'Evaluator', evaluatorInput, 'hex', 'aes-128-reverse.txt', 'false']);
      // run evaluator party
      const evaluator = new Process('node', ['demo/party.js', 'Garbler', garblerInput, 'hex', 'aes-128-reverse.txt', 'false']);

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