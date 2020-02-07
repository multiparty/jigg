/**
 * Channel abstraction for communications.
 * @module src/comm/channel
 */

'use strict';

const socket = require('./socket.js');
const OT = require('./ot.js');

/**
 * This callback defines what happens once the protocol begins.
 *
 * @callback startCallback
 */

/**
 * Create a new communications channel.
 * @param {number} port - Port to use for communications
 * @constructor
 */
function Channel(port) {
  this.port = port;
  this.socket = socket.io(port == null ? 3000 : port);
  this.OT = OT(this.socket);
}

/**
 * Establish communications and begin protocol.
 * @param {string} role - Key under which the desired value is expected
 * @param {startCallback} startProtocol - Callback to begin protocol
 */
Channel.prototype.establishAndGo = function (role, startProtocol) {
  this.socket.join(role);
  this.socket.hear('go').then(startProtocol);
};

/**
 * Send the specified value under the specified key.
 * @param {string} key - Key under which the value will be visible to receiver
 * @param {string} value - Value to send under the specified key
 */
Channel.prototype.sendDirect = function (key, value) {
  this.socket.give(key, value);
};

/**
 * Receive the specified value under the specified key.
 * @param {string} key - Key under which the desired value is expected
 * @returns {string} Value under the specified key
 */
Channel.prototype.receiveDirect = function (key) {
  return this.socket.get(key);
};

/**
 * Send the specified value.
 * @param {string[]} pair - Pair of values to send
 */
Channel.prototype.sendOblivious = function (pair) {
  this.OT.send(pair[0], pair[1]);
};

/**
 * Receive the specified value under the specified key.
 * @param {number} bit - Bit to determine which value to receive
 * @returns {string} Next available value
 */
Channel.prototype.receiveOblivious = function (bit) {
  return this.OT.receive(bit);
};

/**
 * Create a new simulated channel.
 * @constructor
 */
function ChannelSimulated() {
  this.direct = {};
  this.oblivious = [];
}

/**
 * Send the specified value under the specified key.
 * @param {string} key - Key under which the value will be visible to receiver
 * @param {string} value - Value to send under the specified key
 */
ChannelSimulated.prototype.sendDirect = function (key, value) {
  // We always send the string version of any data
  // structure over the channel.
  if (!(typeof(value) === 'string')) {
    throw new Error('Only string values should be sent directly over channel');
  }
  this.direct[key] = value;
};

/**
 * Receive the specified value under the specified key.
 * @param {string} key - Key under which the desired value is expected
 * @returns {string} Value under the specified key
 */
ChannelSimulated.prototype.receiveDirect = function (key) {
  return this.direct[key];
};

/**
 * Send the specified value.
 * @param {string[]} pair - Pair of values to send
 */
ChannelSimulated.prototype.sendOblivious = function (pair) {
  this.oblivious.push(pair);
};

/**
 * Receive the bit-specified value from first pair in queue.
 * @param {number} bit - Bit to determine which value to receive
 * @returns {string} Next available value
 */
ChannelSimulated.prototype.receiveOblivious = function (bit) {
  var pair = this.oblivious[0];
  this.oblivious.shift();
  return pair[bit];
};

module.exports = {
  Channel: Channel,
  ChannelSimulated: ChannelSimulated
};
