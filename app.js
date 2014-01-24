
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var cookie  =   require('cookie');
var connect =   require('connect');
var Controller = require('./routes/Controller');

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
app.use(express.cookieParser());
app.use(express.session({secret: 'secret', key: 'express.sid'}));
app.use(app.router);
app.use(express.static(path.join(__dirname, '')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', Controller.indexGet);
app.post('/', Controller.indexPost);
app.get('/game', Controller.game);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var usersIDHash = {};
var loggedUsers = [];
var roomsHash = {};
var activeRooms = [];
var gamesHash = {
    "battleships"   : './battleships',
    "tictactoe"     : './tictactoe',
    "memory"        : './memory'
}

var rtg = require('./routes/CustomClasses');

io = require('socket.io').listen(server);

// Configure global authorization handling. handshakeData will contain
// the request data associated with the handshake request sent by
// the socket.io client. 'accept' is a callback function used to either
// accept or reject the connection attempt.
// We will use the session id (attached to a cookie) to authorize the user.
// in this case, if the handshake contains a valid session id, the user will be authorized.
io.set('authorization', function (handshakeData, accept) {
    // check if there's a cookie header
    if (handshakeData.headers.cookie) {
        // if there is, parse the cookie
        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
        // the cookie value should be signed using the secret configured above (see line 17).
        // use the secret to to decrypt the actual session id.
        handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');
        // if the session id matches the original value of the cookie, this means that
        // we failed to decrypt the value, and therefore it is a fake.
        if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
            // reject the handshake
            return accept('Cookie is invalid.', false);
        }
    } else {
        // if there isn't, turn down the connection with a message
        // and leave the function.
        return accept('No cookie transmitted.', false);
    }
    //all OK, accept the incoming connection
    accept(null, true);
});

io.sockets.on('connection', function (socket) {
    //socket.emit('news', { hello: 'world' });
    //emit active players and rooms
    var clientID = socket.handshake.sessionID;

    console.log('A socket with sessionID ' + socket.handshake.sessionID
        + ' connected!');

    socket.emit('updatePlayersList', loggedUsers);
    socket.emit('updateRoomsList', activeRooms);

    socket.on('register', function (user, callback) {
        console.log(player);
        if(usersIDHash[clientID] != null){
            socket.emit('error', "already registered");
            return;
        }


        if(checkPlayerName(user.name)){
            var player = new rtg.Player();
            player.isPlaying = false;
            player.name = user.name;
            //player.socket = socket;
            player.room = '';
            player.id = clientID;

            usersIDHash[player.id] = player;
            loggedUsers.push({name: user.name, isPlaying: false});

            callback(true);
            socket.emit('updatePlayersList', loggedUsers);
            socket.broadcast.emit('updatePlayersList', loggedUsers);
        } else {
            callback(false);
        }
    });

    socket.on('createRoom', function(room, callback){
        //console.log(room);
        //check if registered user
        if(usersIDHash[clientID] != null){
            socket.emit('error', "already registered");
            return;
        }

        if(roomsHash[room.name] == null){
            //create the room, set players room
            var theRoom = new rtg.Room();
            theRoom.name = room.name;
            theRoom.game = room.game; //TODO: will be supstituted
            theRoom.players = [usersIDHash[clientID]];
            theRoom.isActive = true;
            theRoom.recentMessages = [];

            roomsHash[room.name] = theRoom;
            usersIDHash[clientID].room = theRoom;
            activeRooms.push({name: theRoom.name});

            callback(true);
            socket.emit('redirect', gamesHash[room.game]);
            socket.broadcast.emit('updateRoomList', activeRooms);
        }else {
            callback(false);
        }
    });

    socket.on('chatMessage', function(chatMsg){
        //check if it's logged in and it's in a room
        var player = usersIDHash[clientID];
        console.log("[chatMessage]: player: " + player);
        console.log("[chatMessage]: sessionID: " + socket.handshake.sessionID + " : " + clientID);
        //the user is not registered
        if(player == null)
            return;
        //the player is not participating in a room
//        if(!player.isPlaying)
//            return;

        var theMsg = new rtg.ChatMessage();

        theMsg.from = player.name;
        theMsg.time = Date.now();
        theMsg.message = chatMsg.message;

        socket.emit('chatMessage', theMsg);
        socket.broadcast.to(player.room.name).emit('chatMessage', theMsg);

        player.room.recentMessages.push(theMsg);
    });

    socket.on('gameMessage', function(gameMsg){
        //check if it's logged in and it's in a room
        var player = usersIDHash[clientID];
        //the user is not registered
        if(player == null)
            return;
        //the player is not participating in a room
        if(!player.isPlaying)
            return;

        //TODO: to be implemented
    });


    socket.on('disconnect', function () {
        console.log(usersIDHash[clientID].name + " was deleted from usersIDHash");
        //remove the user from the usersHash
        //delete usersIDHash[clientID];
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
