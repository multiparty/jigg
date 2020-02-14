'use strict';

const io = require('socket.io');

const JIGGClient = require('./jiggClient.js');
const ServerSocket = require('./comm/serverSocket.js');

/**
 * Create a new JIGG server.
 * @param {http} http - An HTTP server to be used to initialize a socket.io server.
 * @param {object} [options] - additional optional options including:
 *                             debug, which defaults to false.
 * @constructor
 * @alias Server
 */
function Server(http, options) {
  const self = this;

  if (options == null) {
    options = {};
  }

  this.http = http;
  this.io = io(http);

  this.parties = {
    Garbler: null,
    Evaluator: null
  };

  this.io.on('connection', function (socket) {
    socket.on('join', self.join.bind(self, socket));
    socket.on('send', self.send.bind(self, socket));
  });

  this.log = function () {};
  if (options.debug) {
    this.log = console.log.bind(console);
  }
}

Server.prototype.join = function (socket, role) {
  const self = this;

  this.log('join', role);
  if (role !== 'Garbler' && role !== 'Evaluator') {
    socket.emit('error', 'Invalid role!');
    return;
  }

  if (this.parties[role] != null) {
    socket.emit('error', 'Role already taken!');
    return;
  }

  this.parties[role] = socket;
  socket.on('disconnect', function () {
    self.parties[role] = null;
  });

  if (this.parties['Garbler'] != null && this.parties['Evaluator'] != null) {
    this.log('Both parties connected');
    this.parties['Garbler'].emit('receive', 'go0');
    this.parties['Evaluator'].emit('receive', 'go0');
  }
};

Server.prototype.send = function (socket, tag, msg) {
  this.log('send', tag);
  let target = this.parties['Evaluator'];
  if (socket === this.parties['Evaluator']) {
    target = this.parties['Garbler'];
  }

  target.emit('receive', tag, msg);
};

/**
 * Creates and returns a new JIGG Client Agent
 * This agent is wired into the server, to avoid unnecessary overheads.
 * @param {string} role - either 'Garbler' or 'Evaluator'.
 * @param {object} [options] - same format as the Client Agent constructor.
 * @return {Agent} the client Agent ready to use normally.
 */
Server.prototype.makeAgent = function (role, options) {
  options = Object.assign({}, options, {__Socket: ServerSocket});
  return new JIGGClient(role, this, options);
};

module.exports = Server;