var io = require('socket.io-client');

var socket = io();

/*
 *  Listen from server
 */
function hear(tag) {
  return new Promise(function (resolve) {
    socket.on(tag, function (msg) {
      resolve(msg);
    });
  });
}

/*
 *  Direct call to the server
 */
function call(tag, msg) {
  socket.emit(tag, msg);
}

/*
 *  Get a string given by the other party
 */
function get(tag) {
  socket.emit('listening for', tag);
  return new Promise(function (resolve) {
    socket.on(tag, function (msg) {
      // console.log('received msg:', tag, msg);
      resolve(msg);
    });
  });
}

/*
 *  Give a string to the other party
 */
function give(tag, msg) {
  if (msg != null && typeof(msg.stringify) === 'function') {
    msg = msg.stringify();
  }

  socket.emit('send', tag, msg);
}

/*
 *  Connect to the server
 */
function join(role) {
  socket.emit('join', role);
}

var idnumber = 0;
function nextid() {
  idnumber++;  // DEBUG SOON: idnumber is getting mutated somehow
  return parseInt(String(idnumber));
}

function geturl(path, type) {
  return new Promise(function (resolve) {
    fetch(path).then(function (response) {
      resolve(response[type]());
    });
  });
}

module.exports = {
  geturl: geturl,
  nextid: nextid,
  join: join,
  give: give,
  get: get,
  call: call,
  hear: hear
};