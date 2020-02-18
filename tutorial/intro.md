# Intro to Garbled Circuits with JIGG

This tutorial includes a brief introduction to Yao's garbled circuits for two parties and how to carry out a computation using JIGG.

# What are garbled circuits? and Why use them?
Garbled circuits are a specific construction of private function evaluation for boolean circuits.  A great introduction to the more in-depth math surrounding garbled circuits can be found at [here](http://web.mit.edu/sonka89/www/papers/2017ygc.pdf), however the absolute basics are as follows.

JIGG focuses on the two-party case.  Each computation involves a _garbler_, and an _evaluator_.  These two parties communicate through the help of a communications server.  This server does not contribute data nor computational power to the computation, but exists for the sole purpose of passing messages between the two participating parties.

The garbler and evaluator each know their own private inputs, as well as a public function (represented as a boolean circuit) that they both want to run on their private inputs and return a public output.  In JIGG, this boolean circuit is stored in a text file as a list of boolean logic gates.

In particular, JIGG accepts circuits specified using the [Bristol Fashion](https://homes.esat.kuleuven.be/~nsmart/MPC/).

The circuit for a 4-input bit NAND circuit looks like the following:
```ada
4 8            # 4 gates, 8 wires
2 2 2          # 2 parties, 2-bit inputs for both
1 1            # 1 output, 1 bit long
2 1 0 1 4 AND  # 2 in, 1 out, W4 := W0 && W1
2 1 2 3 5 AND  # 2 in, 1 out, W5 := W2 && W3
2 1 4 5 6 AND  # 2 in, 1 out, W6 := W4 && W5
1 1 6 7 INV    # 1 in, 1 out, W7 := ~W6
```

```neptune[inject=true,language=HTML]
<img src="src/nand4.svg" width="300" />
```

**Note:**
If gate-by-gate description seems too low-level, you may also write circuits on a macro level if preferred and compile down using [CASM](https://github.com/wyatt-howe/macro-circuit-assembler#readme).  Even ASCI C compilers exist that assemble JIGG compatible (Bristol fashion) circuits, but we make no special note due to their generally lesser utility performance-wise.

<!-- ## Advantages over Arithmetic Circuits -->
All of the widely accepted solutions for secure function evaluation use either boolean circuits (and operate through garbled gates) or arithmetic circuits (and operate over secret shares).  Our other framework [JIFF](https://github.com/MPC-SoK/frameworks/wiki/JIFF) provides a complete system around the arithmetic approach, however this section highlights the garbled variant.

__Advantages over Arithmetic Circuits__:
1. Latency: while protocols based upon secret sharing require a number of back-and-forth messages between the parties proportional to the size of their arithmetic circuit,
the boolean circuit in JIGG only has to be sent once (after the garbling is done locally by the garbler) and communication of initial inputs and the final outputs remain constant.
This means computation speed is more determined by the participating parties themselves, rather than slow networking.

2. Linearity: circuits don't have to be a composition of arithmetic operators only—anything programmable with boolean logic is computable.<!-- Mention C-to-boolean circuit compilers? -->

__Costs of Garbled Cricuits in JIGG__:
1. Both Garbling and evaluating require many cryptographic operations (proportional to the number of AND gates in the circuit).
2. Garbling is about 4 times as expensive as evaluating.

# Setup
JIGG requires setting up a regular http server. The http server will later be used
by the JIGG server when created.

```neptune[frame=setup1,title=Server&nbsp;Setup,run=false]
// Create a standard http webserver
const express = require('express');
const http = require('http');
const app = express();
const httpServer = http.createServer(app);

// Run server on some port
httpServer.listen(9122, function () {
  Console.log('http listening on *:', 9122);
});
```

JIGG exposes Client and Server modules. The Client module is used to instantiate an evaluator or a garbler party in either
a node.js environment or in the browser. The server module can only be used in a node.js environment, to instantiate a JIGG server.

```neptune[frame=setup2,title=Node.js,run=false]
const JIGG = require('jigg');
// JIGG.Server provides the server module
// JIGG.Client provides the client module
```
```neptune[frame=setup2,title=Browser,run=false,lang=html]
<script src='/dist/jigg.js'></script>
<!-- exposes global JIGG that is the Client module directly: no need to use JIGG.Client! -->
```

# Examples

## A Simple Example: 4-bit Logical And
This circuit is as simple as it sounds. Our two parties provide each provide 2 bits of inputs. The circuit computes the logical and over these inputs. If all bits were 1, the circuit outputs 1, otherwise it outputs 0.

```neptune[frame=1,title=Circuit,run=false]
# 3 gates with 7 wires
3 7
# 2 inputs in total, the garbler has 2 bits inputs, the evaluator has 2 bits inputs
2 2 2
# 1 output consisting of 1 bit
1 1

# input wires are always the first wires, output ones are the last ones
# so in this case:
# 0, and 1 are the garbler's input wires
# 2 and 3 are the evaluator's
# 6 is the output wire

# gates
2 1 0 1 4 AND # 4 = 0 AND 1
2 1 2 3 5 AND # 5 = 2 AND 3
2 1 4 5 6 AND # 6 = 4 AND 5
```

```neptune[inject=true,lang=javascript]
let add32Circuit, sha256Circuit;

function getCode(id) { return document.getElementById(id).children[0].codeMirrorInstance.getValue() }
function getAnd4Circuit() { return getCode('1-tab-1-tab'); }
function getAdd32Circuit() { return add32Circuit; }
function getSha256Circuit() { return sha256Circuit; }

window.fetch('/circuits/bristol/arith-add-32-bit-old.txt').then(async function (circuit) {
    add32Circuit = await circuit.text();
});
window.fetch('/circuits/bristol/sha-256-reverse.txt').then(async function (circuit) {
    sha256Circuit = await circuit.text();
});
```

Now that we have the circuit, it is time to write the code for the parties and the server. JIGG requires minimal configurations.
All we have to do is provide the JIGG parties with the address of the server, the circuit, and the inputs.

The computation is asynchronous because it involves communication. The output is made available through a promise.
Additionally, a listener may be set to keep track of the progress of the computation.

```neptune[frame=2,scope=server,title=Server,env=server]
// Create new JIGG Server, this server runs whenever httpServer is running
const jiggServer = new JIGG.Server(httpServer);
Console.log('JIGG Server created');
```

```neptune[frame=2,scope=garbler1,title=Garbler,env=browser,offline=false]
const inputs = [0, 1];
const circuit = getAnd4Circuit();

// in node.js, use new JIGG.Client(...)
const agent = new JIGG('Garbler', 'http://localhost:9122');
agent.loadCircuit(circuit);
agent.setInput(inputs);

// display progress and output
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    Console.log(status, currentGate, totalGates, error);
});
agent.getOutput().then(function (outputs) {
    Console.log('Output', outputs[0]);
    agent.disconnect(); // close the connection
});

// start
agent.start();
```

```neptune[frame=2,scope=evaluator1,title=Evaluator,env=browser,offline=false]
const inputs = [0, 1];
const circuit = getAnd4Circuit();

// in node.js, use new JIGG.Client(...)
const agent = new JIGG('Evaluator', 'http://localhost:9122');
agent.loadCircuit(circuit);
agent.setInput(inputs);

// display progress and output
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    Console.log(status, currentGate, totalGates, error);
});
agent.getOutput().then(function (outputs) {
    Console.log('Output', outputs[0]);
    agent.disconnect(); // close the connection
});

// start
agent.start();
```

## Input/output encoding: 32-bit Addition

JIGG supports various types of inputs/outputs: in addition to providing bits (the default), JIGG can handle
numbers and hexadecimal encoded strings. JIGG will automatically transform these encodings to bits
and back.

Note: some circuits you find in this repository or online have their input / output wires reversed, i.e. they expect
the least significant bit first as opposed to last. For circuits like these, it is recommended you transform the input
to bit yourself, and make sure the bits are fed in the right order.

We will not show the circuit here. You can find it [in the JIGG repository](https://github.com/multiparty/jigg/blob/eacdc116db07fbfed6f38f9b19cd80280816254a/circuits/bristol/arith-add-32-bit-old.txt).
The circuit behaves as you would expect. For every two bits at the same position in the input, the circuit XORs these bits and the carry bit (initially 0)
to find the output bit in the corresponding position, the circuit then determines the next carry by checking if
any two of the input bits and previous carry wires are 1.

```neptune[frame=3,scope=garbler3,title=Garbler,env=browser,offline=false]
const input = 154;
const circuit = getAdd32Circuit();

// in node.js, use new JIGG.Client(...)
const agent = new JIGG('Garbler', 'http://localhost:9122');
agent.loadCircuit(circuit);
agent.setInput(input, 'number');

// display progress and output
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    Console.log(status, currentGate, totalGates, error);
});
agent.getOutput('number').then(function (output) {
    Console.log('Output', output);
    agent.disconnect();
});

// start
agent.start();
```

```neptune[frame=3,scope=evaluator3,title=Evaluator,env=browser,offline=false]
const input = 310;
const circuit = getAdd32Circuit();

// in node.js, use new JIGG.Client(...)
const agent = new JIGG('Evaluator', 'http://localhost:9122');
agent.loadCircuit(circuit);
agent.setInput(input, 'number');

// display progress and output
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    Console.log(status, currentGate, totalGates, error);
});
agent.getOutput('number').then(function (output) {
    Console.log('Output', output);
    agent.disconnect();
});

// start
agent.start();
```

# Advanced Usage

We provide a few examples of advanced usage below that can help improve performance for large circuits.

## Server as a Garbler/Evaluator

If desired, the server can also act as either a garbler or evaluator. After the JIGG server is initialized regularly.
The **makeAgent** function provides a garbler or evaluator agent with identical API to the client.

This improves performance when applicable, because it removes the need to have a middle link in communication.

```neptune[frame=4,scope=server,title=Server&nbsp;+&nbsp;Garbler,env=server]
const input = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'; // hex input
const circuit = getSha256Circuit();

const agent = jiggServer.makeAgent('Garbler'); // no need to pass the host name
agent.loadCircuit(circuit);
agent.setInput(input, 'hex');

// Server agent has identical API
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    // do something
});
agent.getOutput('hex').then(function (output) {
    // do something
    agent.disconnect();
});

// start
agent.start();
```

```neptune[frame=4,scope=evaluator3,title=Evaluator,env=browser,offline=false]
const input = '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f'; // hex input
const circuit = getSha256Circuit();

// in node.js, use new JIGG.Client(...)
const agent = new JIGG('Evaluator', 'http://localhost:9122');
agent.loadCircuit(circuit);
agent.setInput(input, 'hex');

// display progress and output
agent.addProgressListener(function (status, currentGate, totalGates, error) {
    Console.log(status, currentGate, totalGates, error);
});
agent.getOutput('hex').then(function (output) {
    Console.log('Output', output);
    Console.log('Output Correct', output === 'fc99a2df88f42a7a7bb9d18033cdc6a20256755f9d5b9a5044a9cc315abe84a7'.toUpperCase());
    agent.disconnect();
});

// start
agent.start();

Console.log('This may take a while...');
```

## Running JIGG in a web worker

Running JIGG in the browser on large circuits can cause the webpage to hang for a few seconds. Both Garbling and evaluating
require many cryptographic operations (proportional to the number of AND gates in the circuit).

This can be avoided by running JIGG inside a web worker in the background. Regular updates about the progress of the JIGG
background task can sent to the UI via the web worker API through JIGG's progress listeners.

A detailed example can be found in the [JIGG repo](https://github.com/multiparty/jigg/tree/master/demo/client).

# Additional Resources

You can find additional circuits and examples in the [JIGG repo](https://github.com/multiparty/jigg).

Detailed documentation for user-facing API can be found in the [online docs](https://multiparty.org/jigg/docs/).
