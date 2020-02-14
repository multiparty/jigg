/**
 * Main module: exposes client and server API. This is the module that is exposed when
 * requiring jigg from node.js.
 *
 * @module JIGG
 */

const JIGGClient = require('./jiggClient.js');
const JIGGServer = require('./jiggServer.js');

/**
 * This callback logs or displays progress.
 *
 * @callback progressListener
 * @param {string} state - one of of the following states: 'connected', 'garbling', 'OT', 'evaluating', 'output', 'error'.
 *                         OT is called after oblivious transfer is executed for the current party, if
 *                         state is garbling or evaluating, then current and total are provided.
 * @param {number} [current] - Progress so far (i.e., numerator).
 * @param {number} [total] - Target total (i.e., the denominator).
 * @param {string|Error} [error] - If any error occured, this will be passed with state 'error'.
 */

module.exports = {
  /**
   * The client class, an alias for {@link Agent}.
   * @see {@link Agent}
   * @example
   * const JIGG = require('jigg');
   * const client = new JIGG.Client('Garbler', 'http://localhost:3000', {debug: true});
   */
  Client: JIGGClient,
  /**
   * The server class
   * @see {@link Server}
   * @example
   * // Using express + http
   * const express = require('express');
   * const http = require('http');
   * const app = express();
   * const httpServer = http.createServer(app);
   *
   * const JIGG = require('jigg');
   * const server = new JIGG.Server(http, {debug: true});
   */
  Server: JIGGServer
};