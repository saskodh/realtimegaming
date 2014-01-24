/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 24.1.14
 * Time: 19:05
 * To change this template use File | Settings | File Templates.
 */

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

var MemoryGame = function(socketIO, room){
    this.io = socketIO;
    this.room = room;
    this.playerOneMap = new MemoryGameState(4, 5);
    this.playerTwoMap = new MemoryGameState(4, 5);

}

MemoryGame.prototype.acceptPlayerMove = function(player, position){
    if(player == TurnEnum.PLAYER_ONE){
        var state = this.playerOneMap.acceptPlayerMove(position);

        //TODO: to be done
    }
}