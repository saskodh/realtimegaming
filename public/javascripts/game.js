/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 23.1.14
 * Time: 18:32
 * To change this template use File | Settings | File Templates.
 */
var socket = null;
var gameEngine = null;

$(document).ready(function(){
    socket = io.connect('/game');

    var playground = $('#gameDiv');

    if(document.Game){
        gameEngine = new document.Game(socket, playground);
        //hide the loader
    }

    socket.on('gameMessage', function(message){
        if(gameEngine)
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

        //scroll down to see the message
        tbody.animate({ scrollTop: tbody[0].scrollHeight}, 1000);
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

        if(msg){
            socket.emit('chatMessage', {message: msg});
            chatInput.val('');
            chatInput.focus();
        }
    });

    $('#txtChatMessage').keydown(function(event){
        if(event.keyCode==13){
            $('#btnSend').trigger('click');
        }
    });

});

var createChatMsgTemplate = function(message){
    var row = $(document.createElement('tr'));

    var date = new Date(message.time);

    var timeCol = $(document.createElement('td')).addClass('chatTimeCol');
    timeCol.html(date.toTimeString().split(' ')[0]);
    var playerCol = $(document.createElement('td')).addClass('chatPlayerCol');
    playerCol.html(message.from);
    var msgCol = $(document.createElement('td')).addClass('chatMsgCol');
    msgCol.html(message.message);

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