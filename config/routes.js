/*!
 * Module dependencies.
 */

var async    = require('async'),
    api_user = 'jeffj',
    api_key = 'rambert',
    sendgrid = require('sendgrid')(api_user, api_key);

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , articles = require('../app/controllers/articles')
  , auth = require('./middlewares/authorization')
  , crudUtils = require('../utils/crudUtils')
  , mongoose = require('mongoose')
  , Todo = mongoose.model('Todo');

/**
 * Route middlewares
 */

var articleAuth = [auth.requiresLogin, auth.article.hasEditAuthorization]
var commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization]
var viewerAuth = [auth.requiresLogin, auth.article.hasViewAuthorization] //this needs to be

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

  app.param('pwResetID', users.loadreset)

  app.get('/reset/:pwResetID', users.resetPWpage)
  app.post('/reset/:pwResetID', users.resetPW)



  app.post('/users', users.create)
  app.post('/users/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session)
  app.get('/users/:userId', users.show)
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
  app.get('/articles', auth.requiresLogin, articles.index)
  app.get('/articles/new', auth.requiresLogin, articles.new)
  app.post('/articles', auth.requiresLogin, articles.create)
  app.get('/articles/:id', viewerAuth, articles.show)
  app.get('/articles/:id/edit', articleAuth, articles.edit)
  app.put('/articles/:id', articleAuth, articles.update)
  app.del('/articles/:id', articleAuth, articles.destroy)

  // viewer routes
  var viewers = require('../app/controllers/viewers')
  app.param('viewerId', viewers.load)
  app.post('/articles/:id/viewer', articleAuth, viewers.create)
  app.del('/articles/:id/viewer/:viewerId', articleAuth, viewers.destroy)
  app.get('/articles/:id/viewer', articleAuth, viewers.share)



  // home route
  app.get('/', auth.requiresLogin,  articles.index)

  // comment routes
  var comments = require('../app/controllers/comments')
  app.param('commentId', comments.load)
  app.post('/articles/:id/comments', auth.requiresLogin, comments.create)
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
