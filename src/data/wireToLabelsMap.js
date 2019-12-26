/**
 * Data structure for a map from wire indices to one or two labels.
 * @module src/data/wireToLabelsMap
 */

'use strict';

const gate = require('./gate.js');
const circuit = require('./circuit.js');

/**
 * Create a new wire-to-labels map data structure instance.
 * @constructor
 */
function WireToLabelsMap() {
  this.placeholder = null;
}

/**
 * Initialize the data structure for labeled wires.
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object} Mapping from each wire index to a list of labels
 */
function initializeWireToLabelsMap(circuit) {
  var wiresToLabels = [null];
  for (var i = 0; i < circuit.wires; i++) {
    wiresToLabels.push([]);
  }
  return wiresToLabels;
}

module.exports = {
  WireToLabelsMap: WireToLabelsMap,
  initializeWireToLabelsMap: initializeWireToLabelsMap
};
