/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 4.2.14
 * Time: 03:07
 * To change this template use File | Settings | File Templates.
 */

var games = {};

//list all game engines here
games['tictactoe'] = require('./TicTacToe');
games['memorygame'] = require('./memory');

var GameFactory = module.exports = {};

GameFactory.createGame = function(gameType){
    if(games[gameType]){
        return new games[gameType]();
    }
    return null;
}