const { spawn } = require('child_process');
const fs = require('fs');
// const test = require('./test.js');

// require('./test.js')("bristol_circuit.txt", [
//   "0",
//   "0",
//   "2"
// ]).then(function(result){
//   log(result);
//
//   setTimeout(function(){
//     require('./test.js')("bristol_circuit.txt", [
//       "0",
//       "0",
//       "2"
//     ]).then(log.bind(null, 'unit test'));
//   }, 5000);
// });
//
// const log = console.log;
// console.log = Function();  // TEMPORARY anti-logging hack

// const config = fs.readFileSync('demo/test/suite/config.json', 'utf8');
//
// (function unit_test() {
//   // unit =
//
//   spawn('node', ['demo/test/suite/test.js',
//     'zero_equal.txt',
//     '["00000000","00000000","1"]'
//   ]).stdout.on('data', (data) => {
//     console.log(data.toString()+"\n\n");
//     setTimeout(function(){
//       unit_test();
//     }, 750);
//   });
// })()

const test = require('./test.js');

// Start the server
var server = require('../../../server.js');

console.log('begin');
const log = console.log;
(function unit_test() {
  log('start');
  test('zero_equal.txt', JSON.parse('["00000000","00000000","1"]')).then(function (data) {
    log(data);
    setTimeout(function () {
      log('continue');
      unit_test();
    }, 1500);
  });
})()
console.log = Function();  // TEMPORARY anti-logging hack
