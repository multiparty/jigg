var socket = io();
// var mailbox = [];
// socket.on('receive', function(msg) {
//   console.log(tag, msg);
//   mailbox.push(msg);
// });

var role = 'whoever';
socket.on('whoami', function(msg) {
  console.log('I am ' + msg + '.');
  role = msg;
});

// socket.on('all set', function(msg) {
//   console.log('Both parties connected.');
// });

/*
 *  Listen from server
 */
function hear(tag) {
  return new Promise(function (resolve) {
    socket.on(tag, function(msg) {
      resolve(msg);
    });
  });
}

/*
 *  Get a string given by the other party
 */
function get(tag) {
  return new Promise(function (resolve) {
    socket.on('receive', function(tag, msg) {
      resolve(msg);
    });
  });
}

/*
 *  Give a string to the other party
 */
function give(tag, msg) {
  socket.emit('send', tag, msg);
}

/*
 *  Connect to the server
 */
function join(role) {
  socket.emit('join', role);
}

join(role);
hear('go').then(main);

/*
 *  2PC code here
 */
function main() {
   if (role === 'garbler') {
     let secret = 1;

     give('num', '3');
   }

   if (role === 'evaluator') {
     let secret = 1;

     get('num').then(console.log.bind(null, 'number'));
   }
}
