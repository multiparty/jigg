'use strict';

const Label = require('../modules/label.js');

const labelParser = function (labelStr) {
  const bytes = new Uint8Array(labelStr.length);
  for (let i = 0; i < labelStr.length; i++) {
    bytes[i] = labelStr.charCodeAt(i);
  }

  return new Label(bytes);
};

module.exports = labelParser;