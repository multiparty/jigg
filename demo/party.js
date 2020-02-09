const JIGG = require('../src/jigg');
const fs = require('fs');

// Handle command line arguments.
const role = process.argv[2];
const input = parseInt(process.argv[3]);

const circuitPath = __dirname + '/../circuits/bristol/arith-add-32-bit-old.txt';
const circuit = fs.readFileSync(circuitPath, 'utf8');

// Application code.
console.time('time');

const agent = new JIGG(role, 'http://localhost:3000', {debug: true});
agent.loadCircuit(circuit);
agent.setInput(input, 'number');
agent.start();

agent.getOutput('number').then(function (output) {
  console.log('Output is:', output);
  console.timeEnd('time');
  agent.socket.disconnect();
});
