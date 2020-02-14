'use strict';

function ServerSocket(jiggServer, agent) {
  this.id = '__SERVER__';
  this._nextId = 0;

  // instances
  this.jiggServer = jiggServer;
  this.agent = agent;

  // mailbox and listeners
  this.listeners = {};
  this.mailbox = {};
}

ServerSocket.prototype.join = function (role) {
  this.jiggServer.join(this, role);
};

ServerSocket.prototype.hear = function (tag, _id) {
  if (_id == null) {
    _id = this._nextId++;
  }

  const self = this;
  return new Promise(function (resolve) {
    self.on(tag + _id, resolve);
  });
};

ServerSocket.prototype.on = function (tag, callback) {
  if (this.mailbox[tag] != null) {
    callback(this.mailbox[tag]);
    delete this.mailbox[tag];
  } else {
    this.listeners[tag] = callback;
  }
};

ServerSocket.prototype.send = function (tag, msg, _id) {
  if (_id == null) {
    _id = this._nextId++;
  }

  this.jiggServer.send(this, tag + _id, msg);
};

ServerSocket.prototype.nextId = function () {
  return this._nextId++;
};

ServerSocket.prototype.disconnect = function () {};

// Specific to a Server Socket, to emulate the server side of the socket
ServerSocket.prototype.emit = function (label, tag, msg) {
  if (label === 'error') {
    this.agent.progress('error', null, null, tag);
    return;
  }

  // label must be 'receive'
  if (this.listeners[tag] != null) {
    this.listeners[tag](msg);
    delete this.listeners[tag];
  } else {
    this.mailbox[tag] = msg;
  }
};

ServerSocket.prototype.disconnect = function () {
  this.listeners['disconnect']();
};

module.exports = ServerSocket;
