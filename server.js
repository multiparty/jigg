require('./lib/.dep/node_modules/app-module-path').addPath(__dirname+'/lib/.dep/node_modules/');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (request, response) => response.sendFile(__dirname+'/client.html'));
app.get('/lib/base.js', (request, response) => response.sendFile(__dirname+'/lib/base.js'));

http.listen(3000, () => console.log('listening on *:3000'));

var party = {garbler: null, evaluator: null};
io.on('connection', function(socket) {
  socket.on('join', function(msg) {
    if (msg === 'garbler') {
      party.garbler = socket.id;
      console.log('connect garbler');
      socket.on('disconnect', function() {
        party.garbler = null;
        console.log('garbler disconnected');
      });
    } else if (msg === 'evaluator') {
      party.evaluator = socket.id;
      console.log('connect evaluator');
      socket.on('disconnect', function() {
        party.evaluator = null;
        console.log('evaluator disconnected');
      });
    } else if (party.garbler == null) {
      party.garbler = socket.id;
      console.log('connect garbler');
      socket.on('disconnect', function() {
        party.garbler = null;
        console.log('garbler disconnected');
      });
    } else if (party.evaluator == null) {
      party.evaluator = socket.id;
      console.log('connect evaluator');
      socket.on('disconnect', function() {
        party.evaluator = null;
        console.log('evaluator disconnected');
      });
    }
  });

  socket.on('send', function(msg) {
    console.log('socket.id', socket.id);
    if (socket.id === party.garbler) {
      console.log('sent', msg, 'to evaluator');
      io.to(party.evaluator).emit('receive', msg);
    }
    if (socket.id === party.evaluator) {
      console.log('sent', msg, 'to garbler');
      io.to(party.garbler).emit('receive', msg);
    }
  });
});
