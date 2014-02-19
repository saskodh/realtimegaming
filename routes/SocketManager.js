/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 10.2.14
 * Time: 17:43
 * To change this template use File | Settings | File Templates.
 */

var cookie  =   require('cookie');
var connect =   require('connect');
var rtg = require('./CustomClasses');
var GameFactory = require('./GameFactory');

var SocketManager = function(socketIO){
    var _io = socketIO;
    var _roomsHash = null;
    var _usersHash = null;
    var _sessionStore = null;

    this.setRoomsHash = function(roomsHash){
        _roomsHash = roomsHash;
    }
    this.setUsersHash = function(usersHash){
        _usersHash = usersHash;
    }
    this.setSessionStore = function(sessionStore){
        _sessionStore = sessionStore;
    }

    this.init = function(){
        _initIndexNamespace();
        _initGameNamespace();
    }

    function _initIndexNamespace(){
        _io.of('/index').on('connection', function(socket){
            //TODO optional: send active rooms and logged users
            //emit rooms
            socket.emit('updateRoomsList', _extractRoomList(_roomsHash));
            socket.emit('updatePlayersList', _extractLoggedInPlayers());
            socket.broadcast.emit('updatePlayersList', _extractLoggedInPlayers());

            socket.on('disconnect', function () {
                //console.log(usersIDHash[clientID].name + " was deleted from usersIDHash");
                //remove the user from the usersHash
                //delete usersIDHash[clientID];
            });
        });
    }

    function _initGameNamespace(){

        //authorize on connecting and collect handshake data
        _io.of('/game').authorization( function (handshakeData, accept) {
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

            _sessionStore.get(handshakeData.sessionID, function(err, session){
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

        _io.of('/game').on('connection', function(socket){
            var newRoom = false;
            var roomName =  socket.handshake.session.room;
            if(roomName){
                //check if the room is active
                if(!_roomsHash[roomName]){
                    console.log("this is the first player in the room!!!!");
                    //this is the first player in the room
                    var room = new rtg.Room();
                    room.id = '/game/' + roomName;
                    room.name = roomName;
                    room.recentMessages = [];
                    room.players = [];

                    if(socket.handshake.session.game){
                        //TODO:
                        room.game = GameFactory.createGame(socket.handshake.session.game);

                        if(room.game != null){
                            room.game.roomName = roomName;
                            room.game.io = _io;
                        }else {
                            console.log("Error in creating the game: GameFactory");
                        }
                        //room.game = socket.handshake.session.game;
                    }

                    _roomsHash[roomName] = room;
                    newRoom = true;
                }
                //join the room you visited
                socket.join(roomName);

                _roomsHash[roomName].players.push(socket);
                //emit recent messages
                socket.emit('recentChatMsgs', _roomsHash[roomName].recentMessages);

                //emit joining message to the room
                var msg = new rtg.ChatMessage(socket.handshake.session.username, "I'm joining the room");

                socket.broadcast.to(roomName).emit('chatMessage', msg);
                //emit player list in the room
//        console.log();
//        console.log(io.sockets.clients(roomsHash[roomName].id));
                //we exprect this to return a list of the players sockets
                //and then from the session to read and return the name

                socket.emit('updatePlayersList', _extractPlayerUsernames(roomName));

                socket.broadcast.to(roomName).emit('updatePlayersList', _extractPlayerUsernames(roomName));

                _io.of('/index').emit('updatePlayersList', _extractLoggedInPlayers());
                if(newRoom)
                    _io.of('/index').emit('updateRoomsList', _extractRoomList(_roomsHash));
            }


            socket.on('chatMessage', function(data){

                var roomName = socket.handshake.session.room;
                var theMsg = new rtg.ChatMessage(socket.handshake.session.username, data.message);

                socket.emit('chatMessage', theMsg);
                socket.broadcast.to(roomName).emit('chatMessage', theMsg);

                _roomsHash[roomName].recentMessages.push(theMsg);

                //to keep just the last 10 msgs
                if(_roomsHash[roomName].recentMessages.length > 10){
                    _roomsHash[roomName].recentMessages.shift();
                }
            });

            socket.on('gameMessage', function(message){
                //fetch the room and the user who sent the message and pass it to the game engine
                var roomName = socket.handshake.session.room;
                var username = socket.handshake.session.username;
                if(roomName && username){
                    if(_roomsHash[roomName] && _usersHash[username]){
                        message.from = _usersHash[username];
                        //message.room = roomsHash[roomName];

                        //pass it to the game engine
                        _roomsHash[roomName].game.considerPlayerMessage(message);
                    }
                }
            });

            socket.on('disconnect', function(){

                var roomName = socket.handshake.session.room;
                var username = socket.handshake.session.username;
                if(roomName && username){
                    //remove the player from the room
                    socket.leave(roomName);
                    _removePlayerFromRoom(roomName, socket.id);

                    //check if no players in the room
                    if(_roomsHash[roomName].players.length == 0){
                        delete _roomsHash[roomName];
                        //emit updateRoomsList to index namespace
                        _io.of('/index').emit('updateRoomsList', _extractRoomList(_roomsHash));
                    } else {

                        //emit leaving message to the room
                        var msg = new rtg.ChatMessage(socket.handshake.session.username, "I'm leaving the room");
                        socket.broadcast.to(roomName).emit('chatMessage', msg);

                        //emit updatePlayerList
                        socket.broadcast.to(roomName).emit('updatePlayersList', _extractPlayerUsernames(roomName));

                        //remove it from the game
                        _roomsHash[roomName].game.removePlayer(_usersHash[username]);
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

    }


    function _removePlayerFromRoom(roomName, socketID){
        var index = -1;
        for(var i=0; i<_roomsHash[roomName].players.length; i++){

            if(_roomsHash[roomName].players[i].id == socketID) {
                index = i;
                break;
            }
        }

        if(index > -1){
            _roomsHash[roomName].players.splice(i, 1);
        }
    }

    function _extractRoomList(roomsHash){
        var res = [];
        for(var roomName in roomsHash){
            if(roomsHash.hasOwnProperty(roomName)){
                var roomObj = {
                    name: roomName,
                    game: roomsHash[roomName].game.gameID,
                    numPlayers: roomsHash[roomName].players.length
                };
                res.push(roomObj);
            }
        }

        return res;
    }


    function _extractPlayerUsernames(roomName){
        var res = [];
        var players = _roomsHash[roomName].players;
        for(var i=0; i<players.length; i++){
            var playerObj = {
                name: players[i].handshake.session.username,
                isPlaying: true
            }

            res.push(playerObj);
        }
        return res;
    }

    function _extractLoggedInPlayers(){
        var res = [];

        for(var username in _usersHash){
            if(_usersHash.hasOwnProperty(username)){
                var userObj = {
                    name: _usersHash[username].username,
                    isPlaying: _usersHash[username].isPlaying
                }

                res.push(userObj);
            }
        }

        return res;
    }
}

module.exports = SocketManager;