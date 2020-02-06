/**
 * Data structure for a map from wire indices to one or two labels.
 * @module src/data/assignment
 */

'use strict';

const gate = require('./gate');
const circuit = require('./circuit');
const label = require('./label');

/**
 * Create a new wire-to-labels map data structure instance;
 * note that the domain of the map begins at 1 and not 0.
 * @constructor
 */
function Assignment() {
  this.mapping = {};
}

/**
 * Assign an ordered collection of labels to a wire index.
 * @param {number} index - Index of wire to which to assign labels
 * @param {Object[]} labels - Ordered collection of labels
 */
Assignment.prototype.set = function (index, labels) {
  this.mapping[index] = labels;
};

/**
 * Get the labels at the specified wire index.
 * @param {number} index - Index of wire for which to return labels
 * @returns {Object[]} Ordered collection of labels
 */
Assignment.prototype.get = function (index) {
  return this.mapping[index];
};

/**
 * Return the data structure instance as a JSON object.
 * @returns {Object} Data structure as a JSON object
 */
Assignment.prototype.toJSON = function () {
  var json = {};
  for (var index in this.mapping) {
    json[index] =
      this.mapping[index].map(function (l) {
        return l.isLabel ? l.toJSON() : l;
      });
  }
  return json;
};

/**
 * Turn an assignment instance into a JSON string.
 * @returns {string} Data structure as a JSON string
 */
Assignment.prototype.toJSONString = function () {
  return JSON.stringify(this.toJSON());
};

/**
 * Build a data structure instance from its JSON representation.
 * @param {string} json - Assignment instance as a JSON object
 * @returns {Object} Instance of the data structure
 */
Assignment.prototype.fromJSON = function (json) {
  var a = new Assignment();
  for (var index in json) {
    a.set(index, json[index].map(label.fromJSON));
  }
  return a;
};

/**
 * Build a data structure instance from its JSON string representation.
 * @param {string} json - Assignment instance in JSON string form
 * @returns {Object} Instance of the data structure
 */
Assignment.prototype.fromJSONString = function (s) {
  return Assignment.prototype.fromJSON(JSON.parse(s));
};

/**
 * Return a subset of the map corresponding to the supplied indices.
 * @param {number[]} indices - Indices of map entries to keep in result
 * @returns {Object} New assignment data structure instance
 */
Assignment.prototype.copyWithOnlyIndices = function (indices) {
  var assignment = new Assignment();
  for (var k = 0; k < indices.length; k++) {
    assignment.set(indices[k], this.mapping[indices[k]]);
  }
  return assignment;
};

module.exports = {
  Assignment: Assignment,
  fromJSON: Assignment.prototype.fromJSON,
  fromJSONString: Assignment.prototype.fromJSONString
};
