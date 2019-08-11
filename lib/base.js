var socket = io();
var mailbox = [];
socket.on('receive', function(msg) {
  console.log(msg);
  mailbox.push(msg);
});

var role = 'whoever';
socket.on('whoami', function(msg) {
  console.log('I am ' + msg + '.');
  role = msg;
  main();
});

$(function () {
  $('form').submit(function(e){
    e.preventDefault();
    socket.emit('send', $('#m').val());
    return false;
  });
});

socket.emit('join', role);

function main() {
  /*
   *  2PC code here
   */
   if (role === 'garbler') {
     
   }
}
