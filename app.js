
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
app.use(express.static(path.join(__dirname, '')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var usersIDHash = {};
var loggedUsers = [];
var roomsHash = {};
var gamesHash = {
    "battleships"   : './battleships',
    "tictactoe"     : './tictactoe',
    "memory"        : './memory'
}

var rtg = require('./routes/CustomClasses');

io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    //socket.emit('news', { hello: 'world' });
    //emit active players and rooms

    socket.emit('updatePlayersList', loggedUsers);

    socket.on('register', function (user, callback) {
        console.log(player);

        if(checkPlayerName(user.name)){
            var player = new rtg.Player();
            player.isPlaying = false;
            player.name = user.name;
            player.socket = socket;
            player.room = '';

            usersIDHash[player.socket.id] = player;
            loggedUsers.push({name: user.name, isPlaying: false});

            callback(true);
            socket.emit('updatePlayersList', loggedUsers);
            socket.broadcast.emit('updatePlayersList', loggedUsers);
        } else {
            callback(false);
        }
    });

    socket.on('createRoom', function(room, callback){
        console.log(room);

        if(roomsHash[room.name] == null){
            //create the room, set players room
            roomsHash[room.name] = room;
            usersIDHash[socket.id].room = room;

            callback(true);
            socket.emit('redirect', gamesHash[room.game]);
        }else {
            callback(false);
        }
    });

    socket.on('chatMessage', function(charMsg){
        //check if it's logged in
    });

    socket.on('gameMessage', function(gameMsg){
        //check if it's logged in
    });
});

function checkPlayerName(playerName){
    var flag = true;
    for(var i=0; i<loggedUsers.length; i++){
        if(loggedUsers[i].name === playerName){
            flag = false;
            break;
        }
    }

    return flag;
}
