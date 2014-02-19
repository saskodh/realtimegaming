/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var connect = require('connect');

var app = express();
var sessionStore = new connect.session.MemoryStore();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: 'secret',
    key: 'express.sid',
    store: sessionStore
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, '')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// our code *************

var usersHash = {};
var roomsHash = {};

//add routes handlers
var Controller = require('./routes/Controller').Controller;
var controller = new Controller(usersHash);

app.get('/', controller.index);
app.post('/register', controller.register);
app.post('/logout', controller.authorizer, controller.logout);
app.post('/createroom', controller.authorizer, controller.createRoom);
app.get('/:game/:room', controller.authorizer, controller.game);

//start the server
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//socket.io
io = require('socket.io').listen(server);
io.set('log level', 1);

var SocketManager = require('./routes/SocketManager');

var socketManager = new SocketManager(io);

socketManager.setRoomsHash(roomsHash);
socketManager.setUsersHash(usersHash);
socketManager.setSessionStore(sessionStore);

socketManager.init();