# JIGG
JavaScript implementation of garbled gates and 2PC boolean circuit protocols

JIGG is designed for semi-honest parties.  We support point-and-permute, free-XOR, free single-input gates, encryption from a random oracle (fixed-key XChaCha20).  The half-AND optimization is compatible but not yet supported.  The default label size is 128 bits and relies on JavaScript's Uint8Array class.  The [`simple-labels`](https://github.com/wyatt-howe/jigg/tree/simple-labels) branch demonstrates dynamically-sized labels ≤53 bits without using arrays.  Some potential improvements are listed in the to-do section.

## Installation and Setup

The entirety of this project is written in JavaScript.  Running the server requires [Node.js](https://nodejs.org/en/), [npm](https://www.npmjs.com/) (both installed via `yum install nodejs npm` or `brew install npm` on macOS), and [Socket.IO](https://socket.io/) and [libsodium](https://www.npmjs.com/package/libsodium).

Run `npm` to install all JIGG dependencies:
```shell
npm install
```

## Running the Prototype

Start the communications server from server.js with the command below and optionally specify a port number such as:
```shell
node server 3000
```

### As a Browser Party
Parties can go to `http://localhost:port/` in a web browser supporting JavaScript to begin communications.  This is strictly a 2-party protocol at the moment.

### As a Node.js Party
Connect a new party in Node.js by running:
```shell
node demo/party.js <circuit> <role> <b16-input>
```
For example to join an AES-128 computation as the garbler, write:
```shell
node demo/party.js aes128.txt garbler 00000000000000000000000000000000  # message in base 16
```

### Demos
We have a 64-bit Equal-to-Zero test (`circuits/zero_equal.txt`) in `circuits/` and several other circuits from the same [page](https://homes.esat.kuleuven.be/~nsmart/MPC/).  Circuits larger than ~6000 gates seem to hang the JS engine (sometimes only temporarily) and so are now forced to run in sequence to prevent this from occurring.

There is now a SHA-256 demo at `sha256.html` and `client.html`.
The boolean circuit for SHA has +100,000 gates, and by limiting the number of gates encrypted in parallel, JIGG is able to compute it in under a minute in the browser.  Test vectors are found [here](https://homes.esat.kuleuven.be/~nsmart/MPC/sha-256-test.txt) and in the `demo/test` folder.

### Circuit Format
JIGG can evaluate a boolean circuit in either of the following formats:

In JavaScript as a circuit object
```javascript
const circuit = {
  wires: 8, gates: 4,
  input: [1, 2, 3, 4], output: [5, 7, 8],
  gate: [
    {wirein: [1,2], wireout: 5, type: 'and'},
    {wirein: [3,4], wireout: 6, type: 'xor'},
    {wirein: [6], wireout: 7, type: 'not'},
    {wirein: [5,7], wireout: 8, type: 'and'}
  ]
};
```

As a circuit in the standardized '[Bristol](https://homes.esat.kuleuven.be/~nsmart/MPC/) [Format](https://homes.esat.kuleuven.be/~nsmart/MPC/old-circuits.html)' which is supported by several compiled MPC libraries such as [SCALE-MAMBA](https://homes.esat.kuleuven.be/~nsmart/SCALE/).
```ada
4 8
1 4
1 3
2 1 0 1 4 AND
2 1 2 3 5 XOR
1 1 5 6 INV
2 1 4 6 7 AND
```

## Running Tests

All of the built-in test vectors can be verified in `npm test`.  Communcations between the server, garbler and evaluator are automated.  You do not need to already have a server running – tests are run over port 3001.

You may also access the test function directly, by running `test.js`.
```shell
node demo/test/suite/test.js <circuit> <testvector>
```
For example to test an equal-to-zero computation with the zero vector, write:
```shell
node demo/test/suite/test.js zero_equal.txt '["00000000","00000000","1"]'
```

Test cases (circuit name, test vector) for the circuits are configured in `demo/test/suite/config.json`.  Test vectors are written as `[input1, input2, output]` as shown above.

## To Do
- Change the current oblivious transfer to use ECC from libsodium
- Encrypt communications between parties
- Half AND gate optimization
