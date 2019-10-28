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

const config = fs.readFileSync('demo/test/suite/config.json', 'utf8');

(function unit_test() {
  // unit =

  spawn('node', ['demo/test/suite/test.js',
    'zero_equal.txt',
    '["00000000","00000000","da5698be17b9b46962335799779fbeca8ce5d491c0d26243bafef9ea1837a9d8"]'
  ]).stdout.on('data', (data) => {
    console.log(data.toString());
    setTimeout(function(){
      unit_test();
    }, 750);
  });
})()
