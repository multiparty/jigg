// require('./src/.dep/node_modules/app-module-path').addPath(__dirname+'/src/.dep/node_modules/');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http, {
  pingTimeout: 25000,
  pingInterval: 50000
});
var sodium = require('libsodium-wrappers');

app.use('/dist', express.static(__dirname + '/dist/'));
app.use('/circuits', express.static(__dirname + '/circuits/'));
app.get('/', (request, response) => response.sendFile(__dirname + '/demo/client.html'));
app.get('/sha', (request, response) => response.sendFile(__dirname + '/demo/sha256.html'));

const open = (port) => http.listen(port, () => console.log('listening on *:'+port));

// If command line, open right away
if (require.main === module) {
  let port = (process.argv.length === 3)? process.argv[2] : 3000;
  open(port);
}

var party = {garbler: null, evaluator: null};
var mailbox = {garbler: {}, evaluator: {}};
var cache = [];
io.on('connection', function (socket) {
  socket.on('join', function (msg) {
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
    console.log('send', tag, msg);
    if (socket.id === party.garbler) {
      if (typeof(mailbox.evaluator[tag]) !== 'undefined' && mailbox.evaluator[tag] != null) {
        mailbox.evaluator[tag](msg);
      } else {
        mailbox.evaluator[tag] = msg;
      }
    }
    if (socket.id === party.evaluator) {
      if (typeof(mailbox.garbler[tag]) !== 'undefined' && mailbox.garbler[tag] != null) {
        mailbox.garbler[tag](msg);
      } else {
        mailbox.garbler[tag] = msg;
      }
    }
  });

  socket.on('listening for', function(tag) {
    console.log('listening for', tag);
    if (socket.id === party.garbler) {
      if (typeof(mailbox.garbler[tag]) !== 'undefined' && mailbox.garbler[tag] != null) {
        const msg = mailbox.garbler[tag];
        console.log('sent', tag, msg, 'to garbler');
        io.to(party.garbler).emit(tag, msg);
        mailbox.garbler[tag] = null;
      } else {
        (new Promise(function(resolve, reject) {
          mailbox.garbler[tag] = resolve;
        })).then(function (msg) {
          console.log('sent', tag, msg, 'to garbler (as promised)');
          io.to(party.garbler).emit(tag, msg);
          mailbox.garbler[tag] = null;
        });
      }
    }
    if (socket.id === party.evaluator) {
      if (typeof(mailbox.evaluator[tag]) !== 'undefined' && mailbox.evaluator[tag] != null) {
        const msg = mailbox.evaluator[tag];
        console.log('sent', tag, msg, 'to evaluator');
        io.to(party.evaluator).emit(tag, msg);
        mailbox.evaluator[tag] = null;
      } else {
        (new Promise(function(resolve, reject) {
          mailbox.evaluator[tag] = resolve;
        })).then(function (msg) {
          console.log('sent', tag, msg, 'to evaluator (as promised)');
          io.to(party.evaluator).emit(tag, msg);
          mailbox.evaluator[tag] = null;
        });
      }
    }
  });
});

const close = function () {
  try {
    console.log('Closing server');
    io.to(party.garbler).emit('shutdown', 'finished');
    io.to(party.evaluator).emit('shutdown', 'finished');
    io.close();
    http.close();
    console.log('Server closed');
  } catch (e) {
    console.log('Closing with error', e);
  }
};

module.exports = {
  open: open,
  close: close
};
