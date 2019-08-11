var socket = io();
socket.on('receive', function(msg) {
  console.log(msg);
});

$(function () {
  $('form').submit(function(e){
    e.preventDefault();
    socket.emit('send', $('#m').val());
    return false;
  });
});

socket.emit('join', 'whoever');
