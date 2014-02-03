/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 22.1.14
 * Time: 07:58
 * To change this template use File | Settings | File Templates.
 */

var Player = function(username){
    this.username = username;
    this.isPlaying = false;
    this.room = '';
    this.game = '';
    this.lastLogin = Date.now();
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