/**
 * Created by Kristian on 1/26/14.
 */

function drawMove(player,position,letter){
    var onTurnHeader = $("#turn");
    onTurnHeader.text("On Move: "+player);
    var clickedDiv = $("#" + position);
    clickedDiv.text(letter);
}

function gameOver(winner,winningLine){
    var onTurnHeader = $("#turn");
    onTurnHeader.text("The winner is "+winner);
    for(var i=0;i<3;i++){
        $("#" + winningLine[i]).css("background-color","red");
    }
}