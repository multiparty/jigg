# JIGG
 JavaScript implementation of garbled gates and 2PC boolean circuit  protocols

 ## Installation and Setup

 The entirety of this project is written in JavaScript.  Running the server requires [Node](https://nodejs.org/en/), [npm](https://www.npmjs.com/), [Socket.IO](https://socket.io/), and [libsodium](https://www.npmjs.com/package/libsodium).

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
 The current circuit in `base.js` is a 64-bit Equal-to-Zero test (`circuits/zero_equal.txt`) and several other circuits from the same [page](https://homes.esat.kuleuven.be/~nsmart/MPC/).  Circuitd larger than ~5000 gates seem to hang the JS engine.  SHA256 should work in theory, but it has +100,000 gates, and JIGG will need some optimizations/throttling before it can reasonably compute a circuit that large in the browser.

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

## To Do
 - Do encryption with AES from libsodium instead of the one-time pad
 - Change current oblivious transfer to use ECC from libsodium
 - Encrypt communications between parties
 - a lot of optimizations (free xor, half and, etc.)
