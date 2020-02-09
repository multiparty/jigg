'use strict';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (request, response) => response.sendFile(__dirname + '/demo/client.html'));
app.get('/sha', (request, response) => response.sendFile(__dirname + '/demo/sha256.html'));
app.use('/dist', express.static(__dirname + '/dist/'));
app.use('/circuits', express.static(__dirname + '/circuits/'));

const parties = {
  Garbler: null,
  Evaluator: null
};

io.on('connection', function (socket) {
  socket.on('join', function (role) {
    console.log('join', role);
    if (role !== 'Garbler' && role !== 'Evaluator') {
      socket.emit('error', 'Invalid role!');
      return;
    }

    if (parties[role] != null) {
      socket.emit('error', 'Role already taken!');
      return;
    }

    parties[role] = socket.id;
    socket.on('disconnect', function () {
      parties[role] = null;
    });

    if (parties['Garbler'] != null && parties['Evaluator'] != null) {
      console.log('Both parties connected.');
      io.to(parties['Garbler']).emit('receive', 'go0');
      io.to(parties['Evaluator']).emit('receive', 'go0');
    }
  });

  socket.on('send', function (tag, msg) {
    console.log('send', tag);
    let target = parties['Evaluator'];
    if (socket.id === parties['Evaluator']) {
      target = parties['Garbler'];
    }

    io.to(target).emit('receive', tag, msg);
  });
});


http.listen(3000, function () {
  console.log('listening on *: 3000');
});