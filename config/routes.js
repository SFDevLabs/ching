/*!
 * Module dependencies.
 */

var async    = require('async'),
    fs    = require('fs');

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , articles = require('../app/controllers/articles')
  , auth = require('./middlewares/authorization')
  , crudUtils = require('../utils/crudUtils')
  , mongoose = require('mongoose')
/**
  * Route middlewares
*/
  , articleAuth = [auth.requiresLogin, auth.article.hasEditAuthorization]
  , commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization]
  , viewerAuth = [auth.requiresLogin, auth.article.hasViewAuthorization]
  , viewerAuthToken = [auth.article.hasViewAuthorizationToken]
  , userAuth = [auth.requiresLogin, auth.user.hasAuthorization];


/**
 * Expose routes
 */

module.exports = function (app, passport) {

  // user routes
  app.get('/login', users.login)
  app.get('/signup', users.signup)
  app.get('/logout', users.logout)
  app.get('/reset', users.resetpage)
  app.post('/reset', users.reset)


  var Converter=require("csvtojson").core.Converter;

  app.post('/upload', function(req, res){

    //console.log(req.body.csv)
    if (!req.files){

      var csvConverter=new Converter({});
          csvConverter.fromString(req.body.csv,function(err, jsonObj){

              return res.send({
                       data:jsonObj
                      ,status: 'raw data'
                    });

          });

    }else{
  
      fs.readFile(req.files.files[0].path, {encoding: 'utf-8'}, function(err,data){
        var csvConverter=new Converter({});
            csvConverter.fromString(data,function(err, jsonObj){
              return res.send({
                 data:jsonObj
                ,status: 'raw data'
              });
            });//CSV convert
            fs.unlinkSync(req.files.files[0].path);
      });//file read


    }

  });//upload 


  app.param('pwResetID', users.loadreset)

  app.get('/reset/:pwResetID', users.resetPWpage)
  app.post('/reset/:pwResetID', users.resetPW)

  app.post('/users', users.create)
  app.post('/users/session', users.savepw,
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session)
  app.get('/users/:userId', users.show)
  app.get('/users/:userId/edit', users.edit)
  app.put('/users/:userId', users.update)



  app.get('/auth/facebook',
    passport.authenticate('facebook', {
      scope: [ 'email', 'user_about_me'],
      failureRedirect: '/login'
    }), users.signin)
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/login'
    }), users.authCallback)
  app.get('/auth/github',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.signin)
  app.get('/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.authCallback)
  app.get('/auth/twitter',
    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }), users.signin)
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }), users.authCallback)
  app.get('/auth/google',
    passport.authenticate('google', {
      failureRedirect: '/login',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }), users.signin)
  app.get('/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/login'
    }), users.authCallback)
  app.get('/auth/linkedin',
    passport.authenticate('linkedin', {
      failureRedirect: '/login',
      scope: [
        'r_emailaddress'
      ]
    }), users.signin)
  app.get('/auth/linkedin/callback',
    passport.authenticate('linkedin', {
      failureRedirect: '/login'
    }), users.authCallback)

  app.param('userId', users.user)

  // article routes
  app.get('/home', auth.requiresLogin ,articles.home)
  app.param('id', articles.load)
  app.get('/articles', auth.requiresLogin, articles.indexSent)
  app.get('/articles/new', auth.requiresLogin, articles.new)
  app.post('/articles', auth.requiresLogin, articles.create)

  app.param('token', articles.token)
  app.get('/articles/:id/token/:token', viewerAuthToken, articles.record, articles.show)
  app.get('/articles/:id', viewerAuth, articles.record, articles.show)
  app.get('/articles/:id/edit', articleAuth, articles.edit)
  app.put('/articles/:id', articleAuth, articles.update)
  app.del('/articles/:id', articleAuth, articles.destroy)

  // viewer routes
  var viewers = require('../app/controllers/viewers')
  app.param('viewerId', viewers.load)
  app.post('/articles/:id/viewer', articleAuth, viewers.create)
  app.post('/articles/:id/send', articleAuth, viewers.sendInvoice)
  app.del('/articles/:id/viewer/:viewerId', articleAuth, viewers.destroy)
  app.get('/articles/:id/viewer', articleAuth, viewers.share)





  // home route
  app.get('/', auth.requiresLogin,  articles.indexSent)

  app.get('/recieved', auth.requiresLogin,  articles.indexRecieved)
  app.get('/sent', auth.requiresLogin,  articles.indexSent)


  // comment routes
  var comments = require('../app/controllers/comments')
  app.param('commentId', comments.load)
  app.post('/articles/:id/comments', auth.requiresLogin, comments.create)
  app.post('/articles/:id/comments/:token', viewerAuthToken, comments.create)
  app.get('/articles/:id/comments', auth.requiresLogin, comments.create)
  app.del('/articles/:id/comments/:commentId', commentAuth, comments.destroy)

  crudUtils.initRoutesForModel(app, auth);

  // tag routes
  var tags = require('../app/controllers/tags')
  app.get('/tags/:tag', tags.index)

  app.get('/crud', function(req, res){
    res.render('crud')
  } );



}
