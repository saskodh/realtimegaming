
/**
 * Module dependencies.
 */
var usersHash = {};
var loggedUsers = [];

var roomsHash = {};
var activeRooms = [];


var express = require('express');
var http = require('http');
var path = require('path');
var cookie  =   require('cookie');
var connect =   require('connect');
var Controller = require('./routes/Controller');

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

app.get('/', function(req, res){
    var username = req.session.username;
    if(username){
        req.session.game = null;
        req.session.room = null;

        usersHash[username].game = null;
        usersHash[username].room = null;
        usersHash[username].isPlaying = false;

        usersHash[username].lastLogin = Date.now();
    }

    res.render('index', {"username": username});
});


app.post('/register', function(req, res){
    var username = req.body.username;

    if(username){
        //TODO: check if the username exists
        if(usersHash[username]){
            //return username is taken
        }else {
            //register user
            usersHash[username] = new rtg.Player(username);

            req.session.username = req.body.username;
            req.session.room = null;
            req.session.game = null;
        }
    }

    //redirect to index
    res.render('index', {"username": username});
});

app.post('/logout', Controller.authorizer, function(req, res){

    if(usersHash[req.session.username])
        delete usersHash[req.session.username];

    req.session.username = null;
    req.session.room = null;
    req.session.game = null;
})

app.post('/createroom', Controller.authorizer, function(req, res){

    var url = '/' + req.body.game + '/' + req.body.room;

    res.redirect(url);
});

app.get('/tictactoe/:room', Controller.authorizer, function(req, res){
    if(req.params.room){
        var params = {
            "game": {
                id: 'tictactoe',
                name: 'Tic tac toe'
            },
            "room": req.params.room
        };

        req.session.room = params.room;
        req.session.game = 'tictactoe';

        usersHash[req.session.username].room = params.room;
        usersHash[req.session.username].game = 'tictactoe';
        usersHash[req.session.username].isPlaying = true;

        res.render('game', params);
    }else {
        //redirect to index
        res.render('index', { "username": req.session.username });
    }
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});




var rtg = require('./routes/CustomClasses');

io = require('socket.io').listen(server);


function extractRoomList(roomsHash){
    var res = [];
    for(var roomName in roomsHash){
        if(roomsHash.hasOwnProperty(roomName)){
            var roomObj = {
                name: roomName,
                game: roomsHash[roomName].game,
                numPlayers: roomsHash[roomName].players.length
            };
            res.push(roomObj);
        }
    }

    return res;
}


io.of('/index').on('connection', function(socket){
    //TODO optional: send active rooms and logged users
    //emit rooms
    socket.emit('updateRoomsList', extractRoomList(roomsHash));
    socket.emit('updatePlayersList', extractLoggedInPlayers());

    socket.on('disconnect', function () {
        //console.log(usersIDHash[clientID].name + " was deleted from usersIDHash");
        //remove the user from the usersHash
        //delete usersIDHash[clientID];
    });
});


io.of('/game').authorization( function (handshakeData, accept) {
    //console.log(handshakeData);
    if (handshakeData.headers.cookie) {

        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

        handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');

        if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
            // reject the handshake
            return accept('Cookie is invalid.', false);
        }
    } else {
        // if there isn't, turn down the connection with a message
        // and leave the function.
        return accept('No cookie transmitted.', false);
    }

    sessionStore.get(handshakeData.sessionID, function(err, session){
        if (err) {
            return accept('Error in session store.', false);
        } else if (!session) {
            return accept('Session not found.', false);
        }
        // success! we're authenticated with a known session.
        handshakeData.session = session;

        if(session.username){
            //the user is logged in
            return accept(null, true);
        }

        return accept('The user is not logged in.', false);
    });
});

io.of('/game').on('connection', function(socket){

    var roomName =  socket.handshake.session.room;
    if(roomName){
        //check if the room is active
        if(!roomsHash[roomName]){
            console.log("this is the first player in the room!!!!");
            //this is the first player in the room
            var room = new rtg.Room();
            room.id = '/game/' + roomName;
            room.name = roomName;
            room.recentMessages = [];
            room.players = [];

            if(socket.handshake.session.game){
                //TODO: room.game = GameFactory.create('socket.handshake.session.game');
                room.game = socket.handshake.session.game;
            }

            roomsHash[roomName] = room;

            //activeRooms.push(socket.handshake.session.room);
            //emit updateRoomsList to index namespace
            io.of('index').in('').emit('updateRoomsList', extractRoomList(roomsHash));
        }

        //join the room you visited
        socket.join(roomName);
        roomsHash[roomName].players.push(socket);

        //emit recent messages
        socket.emit('recentChatMsgs', roomsHash[roomName].recentMessages);

        //emit joining message to the room
        var msg = new rtg.ChatMessage(socket.handshake.session.username, "I'm joining the room");
        socket.broadcast.to(roomName).emit('chatMessage', msg);

        //emit player list in the room
//        console.log();
//        console.log(io.sockets.clients(roomsHash[roomName].id));
        //we exprect this to return a list of the players sockets
        //and then from the session to read and return the name

        socket.emit('updatePlayersList', extractPlayerUsernames(roomName));
    }


    socket.on('chatMessage', function(data){

        var roomName = socket.handshake.session.room;
        var theMsg = new rtg.ChatMessage(socket.handshake.session.username, data.message);

        socket.emit('chatMessage', theMsg);
        socket.broadcast.to(roomName).emit('chatMessage', theMsg);

        //TODO: update function that will keep just the last 10 msgs
        roomsHash[roomName].recentMessages.push(theMsg);
    });

    socket.on('gameMessage', function(data){

    });

    socket.on('disconnect', function(){

        var roomName = socket.handshake.session.room;
        if(roomName){
            //remove the player from the room
            socket.leave(roomName);
            removePlayerFromRoom(roomName, socket.id);

            //check if no players in the room
            if(roomsHash[roomName].players.length == 0){
                delete roomsHash[roomName];
            } else {

                //emit leaving message to the room
                var msg = new rtg.ChatMessage(socket.handshake.session.username, "I'm leaving the room");
                socket.broadcast.to(roomName).emit('chatMessage', msg);

                //emit updatePlayerList
                socket.emit('updatePlayersList', extractPlayerUsernames(roomName));
            }
        }
    });

    //emit recent messages in his room
    /*
    * vo io.sockets.manager.rooms['ime na soba'] lista od id na soketite koi napravile join na taa soba
    *
    * sobite ke moze da se menadziraat na
    *   on.('connection') - kreiraj ako ne postoi, dodadi socket
    *   on.('disconnect') - proveri uste kolku igraci ima vo sobata, ako nema nikoj brisi ja
    *
    * vo sobata da se cuva instanca od game engine-ot
    *
    * kako ke znaeme za koja soba e porakata, od sesijata ke proverime vo koja soba e korisnikot
    *
    * nema da se dozvoluva najavuvanje ako korisnikot veke postoi
    *
    * stom otvori index se brise room od negovata sesija
    * */
    //emit players in the room

    //start the game

    //on gameMessage forward to the rooms' game engine
    //on chatMessage broadcast the message to the room
});


function removePlayerFromRoom(roomName, socketID){
    var index = -1;
    for(var i=0; i<roomsHash[roomName].players.length; i++){

        if(roomsHash[roomName].players[i].id == socketID) {
            index = i;
            break;
        }
    }

    if(index > -1){
        roomsHash[roomName].players.splice(i, 1);
    }
}


function extractPlayerUsernames(roomName){
    var res = [];
    var players = roomsHash[roomName].players;
    for(var i=0; i<players.length; i++){
        var playerObj = {
            name: players[i].handshake.session.username,
            isPlaying: true
        }

        res.push(playerObj);
    }
    return res;
}

function extractLoggedInPlayers(){
    var res = [];

    for(var username in usersHash){
        if(usersHash.hasOwnProperty(username)){
            var userObj = {
                name: usersHash[username].username,
                isPlaying: usersHash[username].isPlaying
            }

            res.push(userObj);
        }
    }

    return res;
}