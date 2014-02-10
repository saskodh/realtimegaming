/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 24.1.14
 * Time: 19:05
 * To change this template use File | Settings | File Templates.
 */

var MemoryGameMessageType = {
    START_GAME_MESSAGE  :   'start',
    GAME_OVER_MESSAGE   :   'gameover',
    RESET_GAME_MESSAGE  :   'reset',
    PLAYER_MOVE_MESSAGE :   'move',
    INFO_MESSAGE        :   'info',
    GAME_STATE_MESSAGE  :   'state'
}

var MemoryGameMessage = function(){
    this.msgType = '';
    this.data = {};
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

var MemoryGame = module.exports = function(){
    this.gameID = 'memorygame';
    this.isRunning = false;
    this.gameState = [];
    this.roomName = '';
    this.io = null;
    this.players = [];
    this.numTiles = 40;
    this.stateMap = [];

    this.resetGame();
    this.initRandom();
}

MemoryGame.prototype.acceptPlayerMove = function(player,position){
    if(!this.isRunning)
        return;

    var existingPlayer = false;
    for(var i=0;i<this.players.length;i++){
        if(this.players[i].username == player.username)
            existingPlayer = true;
    }
    if(!existingPlayer)
        return;

    if(player == this.players[1] && (position <0 || position >= this.numTiles/2))
        return;
    if(player == this.players[0] && (position <20 || position >= this.numTiles))
        return;

    this.gameState[position] = true;

    var state = {
        gameState: this.gameState,
        stateMap:this.stateMap
    };

    this.roomBroadcast(MemoryGameMessageCreator.createGameStateMessage(state));

    return state;
}

MemoryGame.prototype.checkPlayerWon = function(){

}


MemoryGame.prototype.initRandom = function(){
    var leftMap = [];
    var rightMap = [];
    for(var i=0; i<20; i++){
        leftMap[i] = i%10;
        rightMap[i] = i%10;
    }
    leftMap = this.shuffle(leftMap);
    rightMap = this.shuffle(rightMap);

    for(var i=0; i<20; i++){
        this.stateMap[i] = leftMap[i];
        this.stateMap[20+i] = rightMap[i];
    }

    console.log(this.stateMap.toString());
}

MemoryGame.prototype.shuffle = function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);

    return o;
}

MemoryGame.prototype.resetGame = function(){
    for(var i=0;i<this.numTiles;i++){
        this.gameState[i] = false;
    }
}

MemoryGame.prototype.checkGameCanBegin = function(){
    var canStart = true;
    if(this.players.length < 2)
        canStart = false;

    return canStart;
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

        this.isRunning = true;
        console.log("startGame method: isRunning = " + this.isRunning);
        this.roomBroadcast(MemoryGameMessageCreator.createInfoMessage('The game can begin!!!'));
    }
}

MemoryGame.prototype.roomBroadcast = function(message){
    this.io.of('/game').in(this.roomName).emit('gameMessage',message);
}


MemoryGame.prototype.considerPlayerMessage = function(message){
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
