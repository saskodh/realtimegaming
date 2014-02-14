/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 23.1.14
 * Time: 20:38
 * To change this template use File | Settings | File Templates.
 */

var Controller = function(usersHash){
    var that = this;

    var usersHash = usersHash;
    var rtg = require('./CustomClasses');

    function _resolveGame(game, room){
        var gameParams = null;

        if('tictactoe' == game){
            gameParams = {
                "game": {
                    id: 'tictactoe',
                    name: 'Tic tac toe'
                },
                "room": room
            };
        }

        if('memorygame' == game){
            gameParams = {
                "game": {
                    id: 'memorygame',
                    name: 'Memory Game'
                },
                "room": room
            };
        }


        //.....

        return gameParams;
    }

    this.index = function(req, res){
        var username = req.session.username;
        if(username){
            req.session.game = null;
            req.session.room = null;

            usersHash[username].game = null;
            usersHash[username].room = null;
            usersHash[username].isPlaying = false;

            usersHash[username].lastLogin = Date.now();
        }

        var params = {
            "username"  : username
        };

        res.render('index', params);
    }

    this.authorizer = function(req, res, controller){
        if(req.session.username){
            //forward the request
            controller();
        }else {
            res.writeHead(200);
            res.end('You must log in first!');
        }
    }

    this.register = function(req, res){
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
        //res.render('index', {"username": username});
        that.index(req, res);
    }

    this.logout = function(req, res){

        if(usersHash[req.session.username])
            delete usersHash[req.session.username];

        req.session.username = null;
        req.session.room = null;
        req.session.game = null;
    }

    this.createRoom = function(req, res){

        var url = '/' + req.body.game + '/' + req.body.room;

        res.redirect(url);
    }

    this.game = function(req, res){
        var room = req.params.room;
        var game = req.params.game;
        if(room && game){
            var params = _resolveGame(game, room);

            req.session.room = params.room;
            req.session.game = params.game.id;

            usersHash[req.session.username].room = params.room;
            usersHash[req.session.username].game = params.game.id;
            usersHash[req.session.username].isPlaying = true;

            res.render('game', params);
        }else {
            //redirect to index
            //res.render('index', { "username": req.session.username });
            that.index(req, res);
        }
    }
}

module.exports.Controller = Controller;;