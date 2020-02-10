/**
 * Main module: exposes client and server API. This is the module that is exposed when
 * requiring JIGG from node.js.
 *
 * @module src/jigg
 */

const JIGGClient = require('./jiggClient.js');
const JIGGServer = require('./jiggServer.js');

module.exports = {
  Client: JIGGClient,
  Server: JIGGServer
};