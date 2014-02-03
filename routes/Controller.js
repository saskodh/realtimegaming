/**
 * Created with JetBrains WebStorm.
 * User: sasko
 * Date: 23.1.14
 * Time: 20:38
 * To change this template use File | Settings | File Templates.
 */

var Controller = module.exports = {};

Controller.indexGet = function(request, response){
    response.render('index', { title: 'Express' });
};

Controller.indexPost = function(request, response){
    console.log(request);
    //check if it's for user registration

    //check if it's for room creation

    response.render('index', { title: 'Express' });
};

Controller.game = function(request, response){
    response.render('game', {});
};

Controller.register = function(req, res){

}

Controller.authorizer = function(req, res, controller){
    if(req.session.username){
        //forward the request
        controller();
    }else {
        res.writeHead(200);
        res.end('You must log in first!');
    }
}