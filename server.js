require('./lib/.dep/node_modules/app-module-path').addPath(__dirname+'/lib/.dep/node_modules/');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (request, response) => response.sendFile(__dirname + '/client.html'));
app.get('/lib/base.js', (request, response) => response.sendFile(__dirname + '/lib/base.js'));

http.listen(3000, () => console.log('listening on *:3000'));

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
  });
});
