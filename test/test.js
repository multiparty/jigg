var assert = require('assert');
var expect = require('chai').expect;
var parser = require('../src/lib/parser');

describe('parser', function() {
  var and4_bristol = "3 7\n4 1\n1 1\n2 1 0 1 4 AND\n2 1 2 3 5 AND\n2 1 4 5 6 AND";
  var and4_json = {
    "gates": 3, "wires": 7,
    "input": [1, 2, 3, 4], 
    "output": [7],
    "gate": [
      {"type": "and", "wirein": [1,2], "wireout": 5},
      {"type": "and", "wirein": [3,4], "wireout": 6},
      {"type": "and", "wirein": [5,6], "wireout": 7}
    ]
  };

  describe('#circuit_parse_bristol()', function () {
    it('circuit_parse_bristol', function() {
      expect(parser.circuit_parse_bristol(and4_bristol)).to.eql(and4_json);
    });
  });
});
