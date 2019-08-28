# JIGG
 JavaScript implementation of garbled gates and 2PC boolean circuit protocols

 ## Installation and Setup

 The entirety of this project is written in JavaScript.  Running the server requires [Node](https://nodejs.org/en/), [npm](https://www.npmjs.com/) (both installed via `yum install nodejs npm` or `brew install npm` on macOS), and [Socket.IO](https://socket.io/) and [libsodium](https://www.npmjs.com/package/libsodium).

 Run `npm` to install all JIGG dependencies inside the `lib/.dep` directory:
 ```shell
 npm install --prefix lib/.dep
 ```

 ## Running the Prototype

 ### As a Server
 Start the server from server.js with the command below and optionally specify a port number such as:
 ```shell
 node server 3000
 ```

 ### As a Party
 Parties can go to `http(s)://localhost:port/` in a web browser supporting JavaScript to begin communications.  This is strictly a 2-party protocol at the moment.

 ### Demos
 The current circuit in `lib/base.js` is a 64-bit Equal-to-Zero test (`circuits/zero_equal.txt`) and several other circuits from the same [page](https://homes.esat.kuleuven.be/~nsmart/MPC/).  Circuits larger than ~6000 gates seem to hang the JS engine (sometimes only temporarily) and so are now forced to run in sequence to prevent this from occurring.

 There is now a SHA-256 demo at `sha256.html` and `client.html`.
 The boolean circuit for SHA has +100,000 gates, and by limiting the number of gates encrypted in parallel, JIGG is able to compute it in 4-5 minutes in the browser.  Test vectors are found [here](https://homes.esat.kuleuven.be/~nsmart/MPC/sha-256-test.txt).

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

As a circuit in the standardized '[Bristol](https://homes.esat.kuleuven.be/~nsmart/MPC/) [Format](https://homes.esat.kuleuven.be/~nsmart/MPC/old-circuits.html)' which is supported by several compiled MPC libraries such as SHARE-MAMBA.
```ada
4 8
1 4
1 3
2 1 0 1 4 AND
2 1 2 3 5 XOR
1 1 5 6 INV
2 1 4 6 7 AND
```

## Capabilities

JIGG is designed for semi-honest parties.  We support point-and-permute, free-XOR, free single-input gates, encryption from a random oracle (fixed-key XChaCha20).  The half-AND optimization is compatible but not yet supported.  The default label size is 128 bits and relies on JavaScript's Uint8Array.  The branch `simple-labels` demonstrates dynamically sized labels <53 bits without using arrays.  Some potential improvements are listed below.

## To Do
 - Change the current oblivious transfer to use ECC from libsodium
 - Encrypt communications between parties
 - Half AND gate optimization
