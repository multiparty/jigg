var socket = io();

/*
 *  Listen from server
 */
function hear(tag) {
  return new Promise(function (resolve) {
    socket.on(tag, function(msg) {
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
    socket.on(tag, function(msg) {
      // console.log('received msg:', tag, msg);
      resolve(msg);
    });
  });
}

/*
 *  Give a string to the other party
 */
function give(tag, msg) {
  socket.emit('send', tag, msg);
}

/*
 *  Connect to the server
 */
function join(role) {
  socket.emit('join', role);
}
