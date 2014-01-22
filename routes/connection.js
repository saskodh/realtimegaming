/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 22.1.14
 * Time: 08:08
 * To change this template use File | Settings | File Templates.
 */

io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});


exports.start = function(port){
    io.listen(port);
}