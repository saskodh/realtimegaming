/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 23.1.14
 * Time: 18:32
 * To change this template use File | Settings | File Templates.
 */
var socket;

$(document).ready(function(){
    socket = io.connect('http://localhost:3000/');

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