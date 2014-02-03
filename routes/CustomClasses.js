/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 22.1.14
 * Time: 07:58
 * To change this template use File | Settings | File Templates.
 */

var Player = function(){
    this.socket = '';
    this.name = '';
    this.isPlaying = false;
    this.room = '';
}

var Room = function(){
    this.id = '';       //TODO: id needs to be unique
    this.name = '';
    //this.players = [];
    this.game = null;
    this.recentMessages = [];
    this.players = [];
}

var ChatMessage = function(player, message){
    this.from = player;
    this.time = Date.now();
    this.message = message;
}

var GameMessage = function(){

}

module.exports.Player = Player;
module.exports.Room = Room;
module.exports.ChatMessage = ChatMessage;