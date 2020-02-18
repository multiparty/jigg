# JIGG

JavaScript implementation of garbled gates and 2PC boolean circuit protocols.

## Requirements and Installation

This library is implemented entirely in JavaScript. Running the server requires [Node.js](https://nodejs.org/en/), [npm](https://www.npmjs.com/) (both installed via `yum install nodejs npm` or `brew install npm` on macOS), [Socket.IO](https://socket.io/), and [libsodium](https://www.npmjs.com/package/libsodium).

Run `npm` to install all JIGG dependencies:
```shell
npm install
```

## Project Layout

    ├─ circuits/        Circuit files
    │  ├─ macros/       Macro files to assemble circuits using [CASM](https://github.com/wyatt-howe/macro-circuit-assembler)
    │  └─ bristol/      Bristol format files
    ├─ demo/            Demo for client-server deployment scenario
    ├─ src/             Library modules implementing protocol steps for participants
    │  ├─ comm/         Communications modules (such as for OT)
    │  ├─ modules/         Data structure modules (such as circuits)
    │  └─ utils/        Other utility modules (such as cryptographic primitives)
    ├─ test/            End-to-end tests
    └─ tutorial/        Interactive tutorial on using JIGG

## Running The tutorial

You can run the tutorial interactively on your local machine, after cloning JIGG, by using
```shell
cd path/to/JIGG
npm run tutorial
```

## Running Demo Circuit Applications

Start the communications server from server.js with the command below:
```shell
node demo/server.js <port number>
```

### As a Browser Party

Parties can go to `http://localhost:<port>/` in a web browser supporting JavaScript to begin communications.

### As a Node.js Party

Connect a new party in Node.js by running:
```shell
node demo/party.js <port> <role> <input> <encoding> <circuitName>
# <role>: Garbler or Evaluator
# <input>: string with no whitespaces
# <encoding>: bits, number, or hex
# <circuitName>: must include file extension
#                demo will run bristol circuit found at
#                'circuits/bristol/<circuitName>'
```

For example to join an AES-128 computation as the garbler, run:
```shell
node demo/party.js 3000 Evaluator 00000000000000000000000000000000 hex aes-128-reverse.txt
```

### Server + Garbler/Evaluator

The server may also run as a garbler or evaluator. You can acheive this by running the server with
the same arguments as a party:
```shell
node demo/server.js <port> <role> <input> <encoding> <circuitName>
```

## Demo Circuits
We have a variety of circuits available under `circuits/bristol` mostly from this [page](https://homes.esat.kuleuven.be/~nsmart/MPC/).

### Circuit Format
JIGG can parse a circuit in the standardized '[Bristol](https://homes.esat.kuleuven.be/~nsmart/MPC/) [Format](https://homes.esat.kuleuven.be/~nsmart/MPC/old-circuits.html)' which is supported by several compiled MPC libraries such as [SCALE-MAMBA](https://homes.esat.kuleuven.be/~nsmart/SCALE/).
```ada
4 8
2 2 2
1 3
2 1 0 1 4 AND
2 1 2 3 5 XOR
1 1 5 6 INV
2 1 4 6 7 AND
```

### Circuit Assembler
To create a new circuit, write a macro with existing circuits as its gates and run the [macro-circuit-assembler](https://github.com/wyatt-howe/macro-circuit-assembler/) with:

```shell
npm run casm -- <path_to_macro> <output_path>
```

For example, this macro assembles an AND circuit over 8 bits using
existing 4 bit AND circuits:

```
npm run casm -- circuits/macros/and-8.casm circuits/and-8.txt
```

## Running Tests

All of the built-in test vectors can be verified in `npm test`. The tests will run a server automatically. These are end-to-end tests.

## Capabilities
JIGG is designed for semi-honest parties (in either node or in the browser). We support point-and-permute, free-XOR, free single-input gates, and encryption from a random oracle (fixed-key XChaCha20). The half-AND optimization is compatible but not yet supported. The default label size is 128 bits and relies on JavaScript's Uint8Array class. The [`simple-labels`](https://github.com/wyatt-howe/jigg/tree/simple-labels) branch demonstrates dynamically-sized labels (that are 53 bits in length or less) without using arrays. Some potential improvements are listed in the to-do section.

## Contributing
JIGG is fully functional as it is now, but there's still more to do (see the list below) before version 1.  Pull requests are welcome for any improvement.  The JIGG source is maintained with the help of [ESLint](https://eslint.org/) for style and the [included test suite](https://github.com/multiparty/jigg#legacy-end-to-end-tests) for stability.

### To Do
- Half-AND gate optimization
- Standardize JSON/serialized/compressed formats for inter-party messages compatible with [SIGG](https://github.com/multiparty/sigg)

## Information and Collaborators
More information about this project, including collaborators and publications, can be found at [multiparty.org](https://multiparty.org/).
