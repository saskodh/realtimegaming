
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var users = {};
var rooms = {};

var rtg = require('./routes/CustomClasses');

io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    //socket.emit('news', { hello: 'world' });
    //emit active players and rooms

    socket.on('my other event', function (data) {
        console.log(data);
    });

    socket.on('register', function (user) {
        console.log(player);
        var player = rtg.Player();
        player.isPlaying = false;
        player.name = user.name;
        player.socket = socket;
        player.room = '';

        users[player.socket.id] = player;
    });

    socket.on('my other event', function (data) {
        console.log(data);
    });
});

