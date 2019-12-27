/**
 * Data structure for a map from wire indices to one or two labels.
 * @module src/data/wireToLabelsMap
 */

'use strict';

const gate = require('./gate.js');
const circuit = require('./circuit.js');
const label = require('./label.js');

/**
 * Create a new wire-to-labels map data structure instance.
 * @constructor
 */
function WireToLabelsMap() {
  this.mapping = {};
}

/**
 * Associate a wire index with a list of labels.
 * @param {number} index - Index of wire to associate with labels
 * @param {Object[]} labels - Array of one or two labels
 */
WireToLabelsMap.prototype.set = function (index, labels) {
  this.mapping[index] = labels;
};

/**
 * Get the labels at the specified wire index.
 * @param {number} index - Index of wire for which to return the label
 * @param {Object[]} labels - Array of one or two labels
 */
WireToLabelsMap.prototype.get = function (index) {
  return this.mapping[index];
};

/**
 * Return the data structure instance as a JSON object.
 * @returns {Object} Data structure as a JSON object
 */
WireToLabelsMap.prototype.toJSON = function () {
  var json = {};
  for (var index in this.mapping) {
    if (this.mapping[index].isArray == null) {
      json[index] = this.mapping[index].toJSON();
    } else {
      json[index] = this.mapping[index];
    }
  }
  return json;
};

/**
 * Return a subset of the map corresponding to the supplied indices.
 * @param {number[]} indices - Indices of map entries to keep in result
 * @returns {Object} Data structure as a JSON object
 */
WireToLabelsMap.prototype.copyWithOnlyIndices = function (indices) {
  var wireToLabels = new WireToLabelsMap();
  for (var k = 0; k < indices.length; k++) {
    wireToLabels.set(indices[k], this.mapping[indices[k]]);
  }
  return wireToLabels;
};

/**
 * Initialize the data structure for labeled wires.
 * @param {Object} circuit - Circuit for which to generate labels
 * @returns {Object} Mapping from each wire index to a list of labels
 */
function initializeWireToLabelsMap(circuit) {
  var wireToLabels = new WireToLabelsMap();
  wireToLabels.set(0, null);
  for (var i = 1; i < circuit.wires+1; i++) {
    wireToLabels.set(i, []);
  }
  return wireToLabels;
}

module.exports = {
  WireToLabelsMap: WireToLabelsMap,
  initializeWireToLabelsMap: initializeWireToLabelsMap
};
