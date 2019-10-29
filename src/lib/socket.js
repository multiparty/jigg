const io = function() {
  var socket = require('socket.io-client')('http://localhost:3000', {forceNew: true});
  // console.log('=====', socket);
  socket.on('shutdown', function (msg) {
    // console.log('Server closed.', msg);
    socket.disconnect();
  });

  /*
  *  Listen from server
  */
  const hear = function(tag) {
    return new Promise(function (resolve) {
      socket.on(tag, function (msg) {
        resolve(msg);
      });
    });
  }

  /*
  *  Direct call to the server
  */
  const call = function(tag, msg) {
    socket.emit(tag, msg);
  }

  /*
  *  Get a string given by the other party
  */
  const get = function(tag) {
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
  const give = function(tag, msg) {
    if (msg != null && typeof(msg.stringify) === 'function') {
      msg = msg.stringify();
    }

    socket.emit('send', tag, msg);
  }

  /*
  *  Connect to the server
  */
  const join = function(role) {
    // console.log('join', role);
    socket.emit('join', role);
  }

  var idnumber = 0;
  const nextid = function() {
    idnumber++;  // DEBUG SOON: idnumber is getting mutated somehow
    return parseInt(String(idnumber));
  }

  return {
    nextid: nextid,
    join: join,
    give: give,
    get: get,
    call: call,
    hear: hear,
    socket: socket
  };
}

const geturl = function(path, type) {
  return new Promise(function (resolve) {
    fetch('http://localhost:3000/' + path).then(function (response) {
      resolve(response[type]());
    });
  });
}

module.exports = {
  io: io,
  geturl: geturl
};
