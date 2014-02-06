/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 24.1.14
 * Time: 19:05
 * To change this template use File | Settings | File Templates.
 */

var MemoryGameMessage = function(){
    this.msgType = '';
    this.data = {};
}

var MemoryGameMessageType = {
    START_GAME_MESSAGE  :   'start',
    GAME_OVER_MESSAGE   :   'gameover',
    RESET_GAME_MESSAGE  :   'reset',
    PLAYER_MOVE_MESSAGE :   'move',
    INFO_MESSAGE        :   'info',
    GAME_STATE_MESSAGE  :   'state'
}

var MemoryGameMessageCreator =  {};
MemoryGameMessageCreator.createStartGameMessage = function(){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.START_GAME_MESSAGE;

    return msg;
}

MemoryGameMessageCreator.createResetGameMessage = function(){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.RESET_GAME_MESSAGE;

    return msg;
}

MemoryGameMessageCreator.createPlayerMoveMessage = function(position){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.PLAYER_MOVE_MESSAGE;
    msg.data = {
        position: position
    }

    return msg;
}

MemoryGameMessageCreator.createGameOverMessage = function(isWinner, winnerName){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.GAME_OVER_MESSAGE;
    msg.data = {
        isWinner: isWinner,
        winnerName: winnerName
    }

    return msg;
}

MemoryGameMessageCreator.createInfoMessage = function(info){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.START_GAME_MESSAGE;
    msg.data = {
        info: info
    }

    return msg;
}

MemoryGameMessageCreator.createGameStateMessage = function(state){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.GAME_STATE_MESSAGE;
    msg.data = {
        state: state
    }

    return msg;
}



TicTacToeGame.prototype.considerPlayerMessage = function(message){
    //message.from
    //message.room
    console.log("message received in the server game engine");
    console.log(this.playerTurn);
    console.log(this.isRunning);
    console.log(this.gameState);
    console.log(this.roomName);
    //dispatcher method
    if(message.msgType == MemoryGameMessageType.START_GAME_MESSAGE){
        console.log("StartGameMessage: addPlayer");
        this.addPlayer(message.from);
    }
    if(message.msgType == MemoryGameMessageType.RESET_GAME_MESSAGE){
        this.resetGame();
    }
    if(message.msgType == MemoryGameMessageType.GAME_OVER_MESSAGE){
        //TODO: vakva poraka nema da stigne od klient
    }
    if(message.msgType == MemoryGameMessageType.PLAYER_MOVE_MESSAGE){
        console.log("PlayerMoveMessage: acceptPlayerMove");
        this.acceptPlayerMove(message.from, message.data.position);
    }
}


var TurnEnum = {
    PLAYER_ONE: 1,
    PLAYER_TWO: 2
}

var MemoryGameState = function(numRows, numColumns){
    this.numTiles = numRows * numColumns;
    this.stateMap = [];
    this.isOpen = [];
    this.hasPrevMove = false;
    this.prevMovePosition = '';

    for(var i=0; i<this.numTiles; i++)
        this.isOpen[i] = false;
}

MemoryGameState.prototype.initRandom = function(){
    for(var i=0; i<2; i++)
        for(var j=0; j<this.numTiles/2; j++)
            this.stateMap[i*this.numTiles/2 + j] = j;

    this.stateMap = this.shuffle(this.stateMap);

    console.log(this.stateMap.toString());
}

MemoryGameState.prototype.isOver = function(){
    var isOver = true;
    for(var i=0; i<this.numTiles; i++)
        if(!this.isOpen[i]){
            isOver = false;
            break;
        }
    return isOver;
}

MemoryGameState.prototype.acceptPlayerMove = function(position){
    if(this.isOpen[position])
        return;

    if(this.hasPrevMove){
        this.hasPrevMove = false;

        if(this.stateMap[position] == this.stateMap[this.prevMovePosition]){
            this.isOpen[position] = true;

        }else {
            this.isOpen[this.prevMovePosition] = false;
        }
    }else {
        this.hasPrevMove = true;
        this.prevMovePosition = position;
        this.isOpen[position] = true;
    }

    var state = {
        isOpen: this.isOpen
    };

    return state;
}

MemoryGameState.prototype.shuffle = function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);

    return o;
}

var MemoryGame = function(){
    this.gameID = 'memoryGame';
    this.io = null;
    this.room = '';
    this.players = [];
    this.playerOneMap = null;
    this.playerTwoMap = null;
    this.isRunning = false;
    this.players = [];
    this.resetGame();
}

MemoryGame.prototype.resetGame = function(){
    if(this.checkGameCanBegin()){
        this.playerOneMap = new MemoryGameState(4,5);
        this.playerTwoMap = new MemoryGameState(4,5);
    }
}

MemoryGame.prototype.checkGameCanBegin = function(){
    var canStart = true;
    if(this.players.length < 2)
        canStart = false;
    if(this.playerOneMap == null || this.playerTwoMap == null)
        canStart = false;
    else{
        if(!this.playerOneMap.isOver() && !this.playerTwoMap.isOver())
            canStart = false;
    }
    return canStart;
}

MemoryGame.prototype.checkGameOver = function(){
    if(this.playerOneMap.isOver()||this.playerTwoMap.isOver())
        return true;
    return false;
}

MemoryGame.prototype.addPlayer = function(player){
    var result = false;

    if(this.players.length < 2){
        //add the player
        result = true;
        this.players.push(player);

        if(this.players.length == 2){
            //the game can begin
            this.startGame();
        }
    }

    return result;
}

MemoryGame.prototype.startGame = function(){
    if(this.isRunning)
        return;

    if(this.players.length == 2){
        console.log("!!!!!!!! The Memory Game can begin !!!!!!!!!!") ;

        TurnEnum.PLAYER_ONE = this.players[0].username;
        TurnEnum.PLAYER_TWO = this.players[1].username;

        this.isRunning = true;
        console.log("startGame method: isRunning = " + this.isRunning);
        this.roomBroadcast(MemoryGameMessageCreator.createInfoMessage('The game can begin!!!'));
    }
}

MemoryGame.prototype.roomBroadcast = function(message){
    this.io.of('/game').in.(this.roomName).emit('gameMessage',message);
}

MemoryGame.prototype.acceptPlayerMove = function(player, position){
    if(!this.isRunning)
        return;

    var existingPlayer = false;
    for(var i=0;i<this.players.length;i++){
        if(this.players[i].username == player.username)
            existingPlayer = true;
    }
    if(!existingPlayer)
        return;

    if(position <0 || position >= 20)
        return;

    var state = this.playerOneMap.acceptPlayerMove(position);

}
