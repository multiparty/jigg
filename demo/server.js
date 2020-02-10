'use strict';

const fs = require('fs');
const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

// Static routes
app.get('/', (request, response) => response.sendFile(__dirname + '/client.html'));
app.get('/sha', (request, response) => response.sendFile(__dirname + '/sha256.html'));
app.use('/dist', express.static(__dirname + '/../dist/'));
app.use('/circuits', express.static(__dirname + '/../circuits/'));

// Create new JIGG Server and run it (by running http)
const JIGG = require('../src/jigg.js');
const server = new JIGG.Server(httpServer);

httpServer.listen(3000, function () {
  console.log('listening on *: 3000');
});

// Optional: in case the server is also a garbler or evaluator
const role = process.argv[2];
if (role != null) {
  const input = parseInt(process.argv[3]);

  const circuitPath = __dirname + '/../circuits/bristol/arith-add-32-bit-old.txt';
  const circuit = fs.readFileSync(circuitPath, 'utf8');

  const agent = server.makeAgent(role);
  agent.loadCircuit(circuit);
  agent.setInput(input, 'number');
  agent.start();

  agent.getOutput('number').then(function (output) {
    console.log('Output is:', output);
    agent.socket.disconnect();
  });
}