/* global JIGG importScripts */
importScripts('/dist/jigg.js');

onmessage = function (e) {
  const role = e.data.role;
  const circuit = e.data.circuit;
  const input = e.data.input;
  const base = e.data.base;

  const agent = new JIGG(role);
  agent.loadCircuit(circuit);
  agent.setInput(input, base);

  agent.addProgressListener(function (status, start, total, error) {
    postMessage({type: 'progress', args: [status, start, total, error]});
  });

  agent.getOutput(base).then(function (output) {
    postMessage({type: 'output', args: output});
  });

  agent.start();
};