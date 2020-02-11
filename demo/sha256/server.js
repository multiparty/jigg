'use strict';

const fs = require('fs');
const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

// Static routes
app.get('/', (request, response) => response.sendFile(__dirname + '/client.html'));
app.use('/dist', express.static(__dirname + '/../../dist/'));
app.use('/circuits', express.static(__dirname + '/../../circuits/'));

// Create new JIGG Server and run it (by running http)
const JIGG = require('../../src/jigg.js');
const server = new JIGG.Server(httpServer);

httpServer.listen(3000, function () {
  console.log('listening on *: 3000');
});

// Optional: in case the server is also a garbler or evaluator
const role = process.argv[2];
if (role != null) {
  const input = process.argv[3];
  const debug = process.argv[4] !== 'false';

  const circuitPath = __dirname + '/../../circuits/bristol/sha-256.txt';
  const circuit = fs.readFileSync(circuitPath, 'utf8');

  const agent = server.makeAgent(role, {debug: debug});
  agent.loadCircuit(circuit);
  agent.setInput(agent.hexutils.hex2bin(input).split('').map(Number));
  agent.start();

  agent.getOutput().then(function (output) {
    console.log(agent.hexutils.bin2hex(output.join('')));
    agent.socket.disconnect();
  });
}