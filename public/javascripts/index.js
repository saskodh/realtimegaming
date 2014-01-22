/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 22.1.14
 * Time: 17:33
 * To change this template use File | Settings | File Templates.
 */

var socket = null;
var player = null;
var room = null;

$(document).ready(function(){
    socket = io.connect("127.0.0.1:3000");

    $('#btnCreateRoom').click(function(){
        if(player == null){
            alert("You must be registered first");
        }

        var roomName = $('#txtRoomName').val();
        var game = $('#cmbGame').val();

        room = {
            name: roomName,
            game: game
        };

        socket.emit('createRoom', room, function(valid){
            if(valid){
                //the room is created, you can continue to the game page
            }else {
                alert("The name was already taken. Please choose another.");
                $('#txtRoomName').focus();
                room = null;
            }
        });
    });

    $('#btnRegister').click(function(){
        var playerName = $('#txtPlayerName').val();

        player = {
            name: playerName
        };

        socket.emit('register', player, function(valid){
            $('#registerModal').modal('hide');
            if(valid){
                alert(playerName + ", you're successfully registered.\n You can pick one of the free rooms or you can create new.");
            }else {
                alert("The name was already taken. Please choose another.");
                $('#txtPlayerName').focus();
                player = null;
            }
        })
    });

    socket.on('redirect', function(url){
        location.pathname = url;
    });

    socket.on('updatePlayersList', function(players){
        //get the player template from the DOM
        var playersList = $('#playersDiv');

        //foreach player in the list add one template item
        players.forEach(function(player){
            playersList.append(createPlayerTemplate(player.name, player.isPlaying));
        });
    });

    socket.on('updateRoomsList', function(rooms){

    });
});

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

var createRoomTemplate = function(room){
    var result =
}