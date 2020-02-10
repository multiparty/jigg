'use strict';

const socketio = require('socket.io-client');

function ClientSocket(hostname, agent) {
  const self = this;

  this._nextId = 0;
  this.socket = socketio(hostname, {forceNew: true});

  // mailbox and listeners
  this.listeners = {};
  this.mailbox = {};
  this.socket.on('receive', function (tag, msg) {
    if (self.listeners[tag] != null) {
      self.listeners[tag](msg);
      delete self.listeners[tag];
    } else {
      self.mailbox[tag] = msg;
    }
  });

  // handle error
  this.socket.on('error', function (error) {
    agent.progress('error', null, null, error);
    throw error;
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
    self.on(tag + _id, resolve);
  });
};

ClientSocket.prototype.on = function (tag, callback) {
  if (this.mailbox[tag] != null) {
    callback(this.mailbox[tag]);
    delete this.mailbox[tag];
  } else {
    this.listeners[tag] = callback;
  }
};

ClientSocket.prototype.send = function (tag, msg, _id) {
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
