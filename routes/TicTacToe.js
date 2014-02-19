/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 24.1.14
 * Time: 18:27
 * To change this template use File | Settings | File Templates.
 */

var TicTacMessageType = {
    START_GAME_MESSAGE  :   'start',
    GAME_OVER_MESSAGE   :   'gameover',
    RESET_GAME_MESSAGE  :   'reset',
    PLAYER_MOVE_MESSAGE :   'move',
    INFO_MESSAGE        :   'info',
    GAME_STATE_MESSAGE  :   'state'
}

var TicTacMessage = function(){
    this.msgType = '';
    this.data = {};
}

var TicTacMessageCreator =  {};

TicTacMessageCreator.createStartGameMessage = function(){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.START_GAME_MESSAGE;

    return msg;
}

TicTacMessageCreator.createResetGameMessage = function(){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.RESET_GAME_MESSAGE;

    return msg;
}

TicTacMessageCreator.createPlayerMoveMessage = function(position){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.PLAYER_MOVE_MESSAGE;
    msg.data = {
        position: position
    }

    return msg;
}

TicTacMessageCreator.createGameOverMessage = function(error, winnerName, winningLine){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.GAME_OVER_MESSAGE;
    msg.data = {
        error: error,
        winnerName: winnerName,
        winningLine: winningLine
    }

    return msg;
}

TicTacMessageCreator.createInfoMessage = function(info){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.INFO_MESSAGE;
    msg.data = {
        info: info
    }

    return msg;
}

TicTacMessageCreator.createGameStateMessage = function(gameState, turn){
    var msg = new TicTacMessage();
    msg.msgType = TicTacMessageType.GAME_STATE_MESSAGE;

    var state = {
        gameState: gameState,
        turn: turn
        //, isOver: false
    }

    msg.data = {
        state: state
    }

    return msg;
}




var TurnEnum = {
    PLAYER_ONE: 1,
    PLAYER_TWO: 2
}

var GameFieldValue = {
    X: 1,
    O: 2,
    EMPTY: 3
}

var TicTacToeGame = module.exports = function(){
    this.gameID = 'tictactoe';
    this.playerTurn = TurnEnum.PLAYER_ONE;
    this.isRunning = false;
    this.gameState = [];
    this.roomName = '';
    this.io = null;
    this.players = [];


    this.resetGame();
}

TicTacToeGame.prototype.acceptPlayerMove = function(player, position){
    //console.log("acceptPlayerMove: " + player.username + ": " + position);
    //if there is not enough players
    if(!this.isRunning)
        return;

    //if it is not his turn
    if(player.username != this.playerTurn)
        return;

    //check if the position is valid
    if(position < 0 || position > 8)
        return;

    if(this.gameState[position] == GameFieldValue.EMPTY){
        if(player.username == TurnEnum.PLAYER_ONE)
            this.gameState[position] = GameFieldValue.X;
        else
            this.gameState[position] = GameFieldValue.O;

        if(this.playerTurn == TurnEnum.PLAYER_ONE)
            this.playerTurn = TurnEnum.PLAYER_TWO;
        else
            this.playerTurn = TurnEnum.PLAYER_ONE;

        // broadcast the new state(gameState and turn) to the game room
        this.roomBroadcast(TicTacMessageCreator.createGameStateMessage(this.gameState, this.playerTurn));

        //check if the game is over (player won or draw game)

        //check if player won
        var winningLine = this.checkPlayerWon(this.gameState[position]);
        if(winningLine){
            //the game is over
            this.stopGame();

            var msg = TicTacMessageCreator.createGameOverMessage(false, player.username, winningLine);

            this.roomBroadcast(msg);
        }

        //check if drawGame
        if(this.checkDrawGame()){
            //TODO: send message for draw game

            this.resetGame();

            this.roomBroadcast(TicTacMessageCreator.createGameStateMessage(this.gameState, this.playerTurn));

        }
    }
}

TicTacToeGame.prototype.checkPlayerWon = function(fieldValue){
    var lines = [];
    lines.push([0, 1, 2]);
    lines.push([3, 4, 5]);
    lines.push([6, 7, 8]);
    lines.push([0, 3, 6]);
    lines.push([1, 4, 7]);
    lines.push([2, 5, 8]);
    lines.push([0, 4, 8]);
    lines.push([2, 4, 6]);

    var winningLine = null;
    for(var i=0; i<lines.length; i++){

        var flag = true;
        for(var j=0; j<3; j++){
            if(this.gameState[lines[i][j]] != fieldValue){
                flag = false;
                break;
            }
        }

        if(flag){
            winningLine = lines[i];
            break;
        }
    }

    return winningLine;
}

TicTacToeGame.prototype.checkDrawGame = function(){
    var flag = true;

    for(var i=0; i<this.gameState.length; i++){
        if(this.gameState[i] == GameFieldValue.EMPTY){
            flag = false;
            break;
        }
    }

    return flag;
}

TicTacToeGame.prototype.addPlayer = function(player){
    var result = false;

    if(this.isRunning){
        console.log('The game is running cant add more players!');
        return false;
    }

    if(this.players.length < 2){
        //add the player
        result = true;
        this.players.push(player);
    }

    return result;
}

TicTacToeGame.prototype.handleStartGameMessage = function(message){
    console.log("StartGameMessage:");
    this.addPlayer(message.from);

    if(!this.isRunning && this.players.length >= 2){
        //the game can begin
        this.startGame();
        //broadcast startGameMessage
        this.roomBroadcast(TicTacMessageCreator.createStartGameMessage());
        this.roomBroadcast(TicTacMessageCreator.createInfoMessage("Game can begin. On turn: " + this.playerTurn));
        this.roomBroadcast(TicTacMessageCreator.createGameStateMessage(this.gameState, this.playerTurn));
    }else {
        this.roomBroadcast(TicTacMessageCreator.createInfoMessage("One more player needed."));
    }
}

TicTacToeGame.prototype.removePlayer = function(player){
    var index = -1;
    for(var i=0; i<this.players.length; i++){
        if(this.players[i].username == player.username){
            index = i;
            break;
        }
    }

    if(index > -1){
        this.players.slice(index, 1);

        //check if he was playing to stop the game
        if(player.username == TurnEnum.PLAYER_ONE || player.username == TurnEnum.PLAYER_TWO){
            this.stopGame();

            var error = player.username + " disconnected. To play press start";
            this.roomBroadcast(TicTacMessageCreator.createGameOverMessage(error, '', ''));
        }

    }
}

TicTacToeGame.prototype.startGame = function(){

    console.log("!!!!!!!! The Game can begin !!!!!!!!!!") ;

    TurnEnum.PLAYER_ONE = this.players[0].username;
    TurnEnum.PLAYER_TWO = this.players[1].username;

    this.playerTurn = TurnEnum.PLAYER_ONE;
    this.isRunning = true;

    this.resetGame();
}

TicTacToeGame.prototype.stopGame = function(){
    this.isRunning = false;
    this.players = [];
    //this.resetGame();
}

TicTacToeGame.prototype.resetGame = function(){
    //this.playerTurn = TurnEnum.PLAYER_ONE;
    //this.isRunning = false;
    this.gameState = [];

    for(var i=0; i<9; i++)
        this.gameState.push(GameFieldValue.EMPTY);
}

TicTacToeGame.prototype.considerPlayerMessage = function(message){
    //message.from
    //message.room

    //dispatcher method
    if(message.msgType == TicTacMessageType.START_GAME_MESSAGE){
        this.handleStartGameMessage(message);
    }
    if(message.msgType == TicTacMessageType.RESET_GAME_MESSAGE){
        this.resetGame();
    }
    if(message.msgType == TicTacMessageType.GAME_OVER_MESSAGE){
        //TODO: vakva poraka nema da stigne od klient
    }
    if(message.msgType == TicTacMessageType.PLAYER_MOVE_MESSAGE){
        //console.log("PlayerMoveMessage: acceptPlayerMove");
        this.acceptPlayerMove(message.from, message.data.position);
    }
}

TicTacToeGame.prototype.roomBroadcast = function(message){
    this.io.of('/game').in(this.roomName).emit('gameMessage',message);
}
