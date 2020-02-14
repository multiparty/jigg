/* global JIGG */
let timeStart;

const getCircuit = function () {
  return $.ajax('/circuits/bristol/' + $('#circuit').val());
};
const countbits = function () {
  const input = $('#input').val();
  const base = $('#base').val();

  let count = input.length;
  if (base === 'hex') {
    count *= 4;
  }
  if (base === 'number') {
    count = Number(input).toString(2).length;
  }

  $('#bitsCount').text('Entered ' + count + ' bits');
};

const progress = function (status, start, total, error) {
  if (status === 'connected') {
    timeStart = new Date().getTime();
  }
  if (status === 'error') {
    document.getElementById('results').innerHTML += '<h3 style="color: red;">' + error.toString() + '</h3>';
    console.log(error);
    return;
  }
  if (status === 'garbling' || status === 'evaluating') {
    document.getElementById('results').innerHTML += '<h4>' + status + ': ' + start + '/' + total + '</h4>';
    return;
  }
  document.getElementById('results').innerHTML += '<h4>' + status + '</h4>';
};
const displayOutput = function (output) {
  const timeEnd = new Date().getTime();
  const time = (timeEnd - timeStart) / 1000;

  const base = $('#base').val();
  if (base === 'bits') {
    output = output.reverse().join('');
  }
  document.getElementById('results').innerHTML += '<h3 style="color: green;">Results: ' + output + ' &nbsp;&nbsp;&nbsp; Took: ' + time + 'seconds</h3>';
};

const start = function () {
  getCircuit().then(function (circuit) {
    const role = $('#partytype').val();
    const base = $('#base').val();

    let input = $('#input').val();
    if (base === 'bits') {
      input = input.split('').map(Number).reverse();
    } else if (base === 'number') {
      input = Number(input);
    }

    if (window.Worker) {
      const worker = new Worker('client/worker.js');
      worker.postMessage({role: role, circuit: circuit, input: input, base: base});
      worker.onmessage = function (e) {
        if (e.data.type === 'progress') {
          progress.apply(window, e.data.args);
        } else {
          displayOutput(e.data.args);
        }
      };
    } else {
      const agent = new JIGG(role);
      agent.addProgressListener(progress);
      agent.loadCircuit(circuit);
      agent.setInput(input, base);
      agent.getOutput(base).then(displayOutput);
      agent.start();
    }
  });
};