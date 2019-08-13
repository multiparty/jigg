require('./lib/.dep/node_modules/app-module-path').addPath(__dirname+'/lib/.dep/node_modules/');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (request, response) => response.sendFile(__dirname+'/client.html'));
app.get('/lib/base.js', (request, response) => response.sendFile(__dirname+'/lib/base.js'));
app.get('/lib/socket.js', (request, response) => response.sendFile(__dirname+'/lib/socket.js'));
app.get('/lib/operators.js', (request, response) => response.sendFile(__dirname+'/lib/operators.js'));

http.listen(3000, () => console.log('listening on *:3000'));

var party = {garbler: null, evaluator: null};
var mailbox = {garbler: {}, evaluator: {}};
var cache = [];
io.on('connection', function(socket) {
  socket.on('join', function(msg) {
    if (msg === 'garbler' || (!(msg === 'evaluator') && party.garbler == null)) {
      party.garbler = socket.id;
      console.log('connect garbler');
      socket.emit('whoami', 'garbler');
      socket.on('disconnect', function() {
        party.garbler = null;
        mailbox.garbler = {};
        console.log('garbler disconnected');
      });
    } else if (msg === 'evaluator' || party.evaluator == null) {
      party.evaluator = socket.id;
      console.log('connect evaluator');
      socket.emit('whoami', 'evaluator');
      socket.on('disconnect', function() {
        party.evaluator = null;
        mailbox.evaluator = {};
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
      if (typeof(mailbox.evaluator[tag]) !== 'undefined' && mailbox.evaluator[tag] != null && !(typeof(mailbox.evaluator[tag]) === 'string')) {
        mailbox.evaluator[tag](msg);
      } else {
        mailbox.evaluator[tag] = msg;
      }
    }
    if (socket.id === party.evaluator) {
      if (typeof(mailbox.garbler[tag]) !== 'undefined' && mailbox.garbler[tag] != null && !(typeof(mailbox.garbler[tag]) === 'string')) {
        mailbox.garbler[tag](msg);
      } else {
        mailbox.garbler[tag] = msg;
      }
    }
  });

  socket.on('listening for', function(tag) {
    console.log('listening for', tag);
    if (socket.id === party.garbler) {
      if (typeof(mailbox.garbler[tag]) === 'string') {
        const msg = mailbox.garbler[tag];
        console.log('sent', tag, msg, 'to garbler');
        io.to(party.garbler).emit(tag, msg);
        mailbox.garbler[tag] = null;
      } else {
        (new Promise(function(resolve, reject) {
          mailbox.garbler[tag] = resolve;
        })).then(function (msg) {
          console.log('sent', tag, msg, 'to garbler');
          io.to(party.garbler).emit(tag, msg);
          mailbox.garbler[tag] = null;
        });
      }
    }
    if (socket.id === party.evaluator) {
      if (typeof(mailbox.evaluator[tag]) === 'string') {
        const msg = mailbox.evaluator[tag];
        console.log('sent', tag, msg, 'to evaluator');
        io.to(party.evaluator).emit(tag, msg);
        mailbox.evaluator[tag] = null;
      } else {
        (new Promise(function(resolve, reject) {
          mailbox.evaluator[tag] = resolve;
        })).then(function (msg) {
          console.log('sent', tag, msg, 'to evaluator');
          io.to(party.evaluator).emit(tag, msg);
          mailbox.evaluator[tag] = null;
        });
      }
    }
  });

  socket.on('oblv', function(params) {
    console.log('oblv', params);
    const msg_id = params.msg_id;
    const length = params.length;
    const random_bit = () => Math.random() < 0.5 ? 0 : 1;

    var r0, r1;
    if (cache[msg_id] === undefined || cache[msg_id].unused) {
      if (cache[msg_id] === undefined) {
        cache[msg_id] = {unused: true};  // or with just {}
      }
      r0 = 0;
      r1 = 0;
      for (var i = 0; i < length; i++) {  // or with map(...)
        r0 += random_bit() * Math.pow(2, i);
        r1 += random_bit() * Math.pow(2, i);
      }
      cache[msg_id].r0 = r0;
      cache[msg_id].r1 = r1;
      cache[msg_id].unused = false;
    } else {
      r0 = cache[msg_id].r0;
      r1 = cache[msg_id].r1;
      cache[msg_id] = {unused: true};  // clear cache[msg_id]
    }

    if (socket.id === party.garbler) {
      socket.emit('oblv'+msg_id, JSON.stringify([r0, r1]));
    }

    if (socket.id === party.evaluator) {
      const d = random_bit();
      socket.emit('oblv'+msg_id, JSON.stringify([d, d ? r1 : r0]));
    }
  });
});
