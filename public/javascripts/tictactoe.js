/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 10.2.14
 * Time: 15:07
 * To change this template use File | Settings | File Templates.
 */

document.Game = (function(){

    var GameFieldValue = {
        X: 1,
        O: 2,
        EMPTY: 3
    }

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

    TicTacMessageCreator.createGameOverMessage = function(isWinner, winnerName, winningLine){
        var msg = new TicTacMessage();
        msg.msgType = TicTacMessageType.GAME_OVER_MESSAGE;
        msg.data = {
            isWinner: isWinner,
            winnerName: winnerName,
            winningLine: winningLine
        }

        return msg;
    }

    var TicTacClient = function(socket, playground){
        var that = this;
        this.socket = socket;
        this.playground = playground;

        //init
        function _createCellTemplate(id){
            return $(document.createElement('div')).addClass('TicTacToeGameCell').prop('id', id);
        }

        this.label = $(document.createElement('h2'));
        this.label.html('Game initialising');

        this.playground.append(this.label);

        this.btnStart = $(document.createElement('button')).addClass('btn btn-default').html("Start Game");
        this.btnStart.click(function(){
            socket.emit('gameMessage', TicTacMessageCreator.createStartGameMessage());
        });
        this.playground.append(this.btnStart);

        var div = $(document.createElement('div')).addClass('ticTacToeContainer');
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
                    that.socket.emit('gameMessage', TicTacMessageCreator.createPlayerMoveMessage(position));
                });
                div.append(template);
            }
        }

        this.playground.append(div);
    }

    TicTacClient.prototype.startGame = function(){
        this.btnStart.hide();

        //clear the table
        for(var i=0; i<9; i++){
            $("#" + i).css("background-color","");
        }
    }
    TicTacClient.prototype.resetGame = function(){
        this.label.html("Draw game");
    }
    TicTacClient.prototype.gameOver = function(data){

        if(!data.error){
            this.label.text("The winner is "+data.winnerName);
            for(var i=0; i<data.winningLine.length; i++){
                $("#" + data.winningLine[i]).css("background-color","red");
            }
        }else {
            this.label.text(data.error);
        }

        this.btnStart.show();
    }
    TicTacClient.prototype.playerMove = function(){}
    TicTacClient.prototype.setInfo = function(info){
        this.label.html(info);
    }

    TicTacClient.prototype.considerMessage = function(message){
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

    TicTacClient.prototype.updateState = function(data){
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

    TicTacClient.prototype.paintGameOver = function(winner,winningLine){
        var onTurnHeader = $("#turn");
        onTurnHeader.text("The winner is "+winner);
        for(var i=0; i<winningLine.length; i++){
            $("#" + winningLine[i]).css("background-color","red");
        }
    }


    return TicTacClient;
})();