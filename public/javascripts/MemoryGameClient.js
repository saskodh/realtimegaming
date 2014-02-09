/**
 * Created by Kristian on 2/9/14.
 */

var GameFieldValue = {
    X: 1,
    O: 2,
    EMPTY: 3
}

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

MemoryGameMessageCreator.createGameOverMessage = function(isWinner, winnerName, winningLine){
    var msg = new MemoryGameMessage();
    msg.msgType = MemoryGameMessageType.GAME_OVER_MESSAGE;
    msg.data = {
        isWinner: isWinner,
        winnerName: winnerName,
        winningLine: winningLine
    }

    return msg;
}

var MemoryGameClient = function(socket, playground){
    var that = this;
    this.socket = socket;
    this.playground = playground;

    //init
    function _createCellTemplate(id){
        return $(document.createElement('div')).addClass('MemoryGameCell').prop('id', id);
    }

    this.label = $(document.createElement('h2'));
    this.label.html('Game initialising');

    this.playground.append(this.label);

    this.btnStart = $(document.createElement('button')).addClass('btn btn-default').html("Start Game");
    this.btnStart.click(function(){
        socket.emit('gameMessage', MemoryGameMessageCreator.createStartGameMessage());
    });
    this.playground.append(this.btnStart);

    var div = $(document.createElement('div'));
    var template = null;
    for(var i=0; i<3; i++){
        for(var j=0; j<3; j++){
            var id = 3*i + j;
            template = _createCellTemplate(id);

            if(id == 3 || id == 6){
                template.css('clear', 'left');
            }

            template.click(function(){
                var position = $(this).prop("id");
                console.log(position);
                that.socket.emit('gameMessage', MemoryGameMessageCreator.createPlayerMoveMessage(position));
            });
            div.append(template);
        }
    }

    this.playground.append(div);
}

MemoryGameClient.prototype.startGame = function(){
    this.btnStart.hide();

    //clear the table
    for(var i=0; i<9; i++){
        $("#" + i).css("background-color","");
    }
}
MemoryGameClient.prototype.resetGame = function(){
    this.label.html("Draw game");
}
MemoryGameClient.prototype.gameOver = function(data){

    if(!data.error){
        this.label.text("The winner is "+data.winnerName);
    }else {
        this.label.text(data.error);
    }

    this.btnStart.show();
}
MemoryGameClient.prototype.playerMove = function(){}
MemoryGameClient.prototype.setInfo = function(info){
    this.label.html(info);
}

MemoryGameClient.prototype.considerMessage = function(message){
    //dispatcher method
    if(message.msgType == TicTacMessageType.START_GAME_MESSAGE){
        this.startGame();
    }
    if(message.msgType == TicTacMessageType.RESET_GAME_MESSAGE){
        this.resetGame();
    }
    if(message.msgType == TicTacMessageType.GAME_OVER_MESSAGE){
        this.gameOver(message.data);
    }
    if(message.msgType == TicTacMessageType.PLAYER_MOVE_MESSAGE){
        this.playerMove();
    }
    if(message.msgType == TicTacMessageType.INFO_MESSAGE){
        this.setInfo(message.data.info);
    }
    if(message.msgType == TicTacMessageType.GAME_STATE_MESSAGE){
        this.updateState(message.data);
    }
}

MemoryGameClient.prototype.updateState = function(data){
    this.label.text("On Move: "+data.state.turn);

    //data.gameState
    for(var i=0; i<data.state.gameState.length; i++){
        var clickedDiv = $("#" + i);

        if(data.state.gameState[i] == GameFieldValue.X)
            clickedDiv.text('X');
        if(data.state.gameState[i] == GameFieldValue.O)
            clickedDiv.text('O');
        if(data.state.gameState[i] == GameFieldValue.EMPTY)
            clickedDiv.text('');
    }
}

TicTacClient.prototype.drawMove = function(player,position,letter){
    var onTurnHeader = $("#turn");
    onTurnHeader.text("On Move: "+player);
    var clickedDiv = $("#" + position);
    clickedDiv.text(letter);
}

MemoryGameClient.prototype.paintGameOver = function(winner,winningLine){
    var onTurnHeader = $("#turn");
    onTurnHeader.text("The winner is "+winner);
    for(var i=0; i<winningLine.length; i++){
        $("#" + winningLine[i]).css("background-color","red");
    }
}

var socket = null;
var gameEngine = null;

$(document).ready(function(){
    socket = io.connect('/game');

    var playground = $('#gameDiv');
    gameEngine = new TicTacClient(socket, playground);
    // socket.emit('gameMessage', TicTacMessageCreator.createStartGameMessage());

    socket.on('gameMessage', function(message){
        gameEngine.considerMessage(message);
    });

    socket.on('recentChatMsgs', function(messages){
        var tbody = $('#chatDiv tbody');
        tbody.empty();

        messages.forEach(function(msg){
            tbody.append(createChatMsgTemplate(msg));
        });
    });

    socket.on('chatMessage', function(chatMsg){
        var tbody = $('#chatDiv tbody');
        tbody.append(createChatMsgTemplate(chatMsg));
    });

    socket.on('updatePlayersList', function(players){
        //get the player template from the DOM
        var playersList = $('#playersDiv');
        playersList.empty();

        //foreach player in the list add one template item
        players.forEach(function(player){
            playersList.append(createPlayerTemplate(player.name, player.isPlaying));
        });
    });

    $('#btnLeaveRoom').click(function(){
        //disconnect the socket
        socket.disconnect();
        document.location = '/';
    });

    $('#btnSend').click(function(){
        var chatInput = $('#txtChatMessage');
        var msg = chatInput.val();
        chatInput.val('');

        socket.emit('chatMessage', {message: msg});
    });

});

var createChatMsgTemplate = function(message){
    var row = $(document.createElement('tr'));
    var timeCol = $(document.createElement('td')).html(message.time);
    var playerCol = $(document.createElement('td')).html(message.from);
    var msgCol = $(document.createElement('td')).html(message.message);

    row.append(timeCol).append(playerCol).append(msgCol);

    return row;
}

var createPlayerTemplate = function(playerName, available){
    var result = $(document.createElement('div'));
    var icon = $(document.createElement('span')).addClass('glyphicon glyphicon-user');
    if(available){
        icon.css("color","limegreen");
    }else {
        icon.css("color","red");
    }

    var name = $(document.createElement('span')).html("  " + playerName);

    result.append(icon);
    result.append(name);

    return result;
}