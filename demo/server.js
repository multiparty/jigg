'use strict';

const fs = require('fs');
const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

// Static routes
app.get('/', (request, response) => response.sendFile(__dirname + '/client.html'));
app.use('/client', express.static(__dirname + '/client/'));
app.use('/dist', express.static(__dirname + '/../dist/'));
app.use('/circuits', express.static(__dirname + '/../circuits/'));

// Create new JIGG Server and run it (by running http)
const JIGG = require('../src/jigg.js');
const server = new JIGG.Server(httpServer);

const port = parseInt(process.argv[2]);
httpServer.listen(port, function () {
  console.log('listening on *:', port);
});

// Optional: in case the server is also a garbler or evaluator
const role = process.argv[3];
if (role != null) {
  let input = process.argv[4];
  let encoding = process.argv[5];
  let circuitName = process.argv[6];
  let debug = process.argv[7] !== 'false';

  // default arguments.
  if (encoding == null) {
    encoding = 'number';
  }
  if (circuitName == null) {
    circuitName = 'arith-add-32-bit-old.txt';
  }

  // encoding
  if (encoding === 'number') {
    input = parseInt(input);
  }
  if (encoding === 'bits') {
    input = input.split('').map(Number);
  }

  // Read circuit
  const circuitPath = __dirname + '/../circuits/bristol/' + circuitName;
  const circuit = fs.readFileSync(circuitPath, 'utf8');

  const agent = server.makeAgent(role, {debug: debug});
  agent.loadCircuit(circuit);
  agent.setInput(input, encoding);
  agent.start();

  agent.getOutput(encoding).then(function (output) {
    console.log(output);
    agent.socket.disconnect();
  });
}