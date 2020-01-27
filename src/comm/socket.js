/**
 * Socket-based communications functions.
 * @module src/comm/socket
 */

'use strict';

/**
 * Create a communication object.
 * @param {number} port - Port to use
 * @returns {Object} I/O object
 */
const io = function(port) {
  port = port == null ? 3000 : port;
  var socket = require('socket.io-client')('http://localhost:'+port, {forceNew: true});
  socket.on('shutdown', function (msg) {
    socket.disconnect();
  });

  /*
  *  Listen from server.
  */
  const hear = function(tag) {
    return new Promise(function (resolve) {
      socket.on(tag, function (msg) {
        resolve(msg);
      });
    });
  };

  /*
  *  Direct call to the server.
  */
  const call = function(tag, msg) {
    socket.emit(tag, msg);
  };

  /*
  *  Get a string given by the other party.
  */
  const get = function(tag) {
    socket.emit('listening for', tag);
    return new Promise(function (resolve) {
      socket.on(tag, function (msg) {
        resolve(msg);
      });
    });
  };

  /*
  *  Give a string to the other party.
  */
  const give = function(tag, msg) {
    socket.emit('send', tag, msg);
  };

  /*
  *  Connect to the server.
  */
  const join = function(role) {
    socket.emit('join', role);
  };

  var idnumber = 0;
  const nextid = function() {
    idnumber++;  // DEBUG SOON: idnumber is getting mutated somehow
    return parseInt(String(idnumber));
  };

  return {
    nextid: nextid,
    join: join,
    give: give,
    get: get,
    call: call,
    hear: hear,
    socket: socket,
    port: port
  };
};

/**
 * Obtain data from specified URL.
 * @param {string} path - URL path to use for the request
 * @param {string} type - Type of response to unwrap
 * @param {number} port - Port to use
 * @returns {Object} I/O object.
 */
const geturl = function(path, type, port) {
  return new Promise(function (resolve) {
    fetch('http://localhost:' + (port == null ? 3000 : port) + '/' + path).then(function (response) {
      resolve(response[type]());
    });
  });
};

module.exports = {
  io: io,
  geturl: geturl
};
