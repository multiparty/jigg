# JIGG
 JavaScript implementation of garbled gates and 2PC boolean circuit  protocols

 ## Installation and Setup

 The entirety of this project is written in JavaScript.  Running the server requires [Node](https://nodejs.org/en/), [npm](https://www.npmjs.com/), and [Socket.IO](https://socket.io/).

 Run `npm` to install all JIGC dependencies inside the `lib/.dep` directory:
 ```shell
 npm install --prefix lib/.dep
 ```

 ## Running the Prototype

 ### As a Server
 Start the server from server.js with the command below and specify a port number such as:
 ```shell
 node server 3000
 ```

 ### As a Party
 Parties can go to `http(s)://localhost:3000/client.html` in a web browser supporting JavaScript to begin communications.  This is a strictly 2-party protocol.

## To Do

 - Replace encryption with AES
 - Write point-and-permute
 - Change current oblivious transfer to use RSA
 - a lot of optimizations (free xor, 4-3 row trick, etc.)
