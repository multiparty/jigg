'use strict';

const socketio = require('socket.io-client');

function ClientSocket(hostname) {
  const self = this;

  this._nextId = 0;
  this.socket = socketio(hostname, {forceNew: true});

  // events
  this.socket.on('shutdown', function () {
    self.socket.disconnect();
  });
}

ClientSocket.prototype.join = function (role) {
  this.socket.emit('join', role);
};

ClientSocket.prototype.hear = function (tag, _id) {
  if (_id == null) {
    _id = this._nextId++;
  }

  const self = this;
  return new Promise(function (resolve) {
    self.socket.emit('listening for', tag + _id);
    self.socket.on(tag + _id, resolve);
  });
};

ClientSocket.prototype.emit = function (tag, msg, _id) {
  if (_id == null) {
    _id = this._nextId++;
  }

  this.socket.emit('send', tag + _id, msg);
};

ClientSocket.prototype.nextId = function () {
  return this._nextId++;
};

ClientSocket.prototype.disconnect = function () {
  this.socket.disconnect();
};

module.exports = ClientSocket;
