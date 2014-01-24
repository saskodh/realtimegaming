/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 24.1.14
 * Time: 18:27
 * To change this template use File | Settings | File Templates.
 */

var TurnEnum = {
    PLAYER_ONE: 1,
    PLAYER_TWO: 2
}

var GameFieldValue = {
    X: 1,
    O: 2,
    EMPTY: 3
}

var TicTacToeGame = function(socketIO){
    this.playerTurn = TurnEnum.PLAYER_ONE;
    this.gameState = [];
    this.room = '';
    this.io = socketIO;

    for(var i=0; i<9; i++)
        this.gameState.push(GameFieldValue.EMPTY);
}

TicTacToeGame.prototype.acceptPlayerMove = function(player, position){
    if(player != this.playerTurn)
        return;

    if(this.gameState[position] == GameFieldValue.EMPTY){
        if(player == TurnEnum.PLAYER_ONE)
            this.gameState[position] = GameFieldValue.X;
        else
            this.gameState[position] = GameFieldValue.O;

        if(this.playerTurn == TurnEnum.PLAYER_ONE)
            this.playerTurn = TurnEnum.PLAYER_TWO;
        else
            this.playerTurn = TurnEnum.PLAYER_ONE;

        // broadcast the new state(gameState and turn) to the game room
        var state = {
            gameState: this.gameState,
            turn: this.playerTurn,
            isOver: false
        }

        //check if the game is over
        if(this.checkGameOver(this.gameState[position])){
            state.isOver = true;
        }

        this.io.sockets.in(this.room).emit('gameMessage', state);
    }
}

TicTacToeGame.prototype.checkGameOver = function(fieldValue){
    var lines = [];
    lines.push([0, 1, 2]);
    lines.push([3, 4, 5]);
    lines.push([6, 7, 8]);
    lines.push([0, 3, 6]);
    lines.push([1, 4, 7]);
    lines.push([2, 5, 8]);
    lines.push([0, 4, 8]);
    lines.push([2, 4, 6]);

    var gameOver = false;
    for(var i=0; i<this.gameState.length; i++){
        if(lines[0] == lines[1] == lines[2] == fieldValue){
            gameOver = true;
            break;
        }
    }

    return gameOver;
}