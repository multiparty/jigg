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
    if (msg === 'garbler' || (!(msg === 'evaluator') && party.garbler == null)) {
      party.garbler = socket.id;
      console.log('connect garbler');
      socket.emit('whoami', 'garbler');
      socket.on('disconnect', function() {
        party.garbler = null;
        console.log('garbler disconnected');
      });
    } else if (msg === 'evaluator' || party.evaluator == null) {
      party.evaluator = socket.id;
      console.log('connect evaluator');
      socket.emit('whoami', 'evaluator');
      socket.on('disconnect', function() {
        party.evaluator = null;
        console.log('evaluator disconnected');
      });
    }
    if (party.garbler != null && party.evaluator != null) {
      console.log('Both parties connected.');
      io.to(party.garbler).emit('go');
      io.to(party.evaluator).emit('go');
    }
  });

  socket.on('send', function(tag, msg) {
    if (socket.id === party.garbler) {
      console.log('sent', tag, msg, 'to evaluator');
      io.to(party.evaluator).emit('receive', tag, msg);
    }
    if (socket.id === party.evaluator) {
      console.log('sent', tag, msg, 'to garbler');
      io.to(party.garbler).emit('receive', tag, msg);
    }
  });
});
