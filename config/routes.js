/*!
 * Module dependencies.
 */

var async    = require('async');

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , organizations = require('../app/controllers/organizations')
  , articles = require('../app/controllers/articles')
  , auth = require('./middlewares/authorization')
  , crudUtils = require('../utils/crudUtils')
  , mongoose = require('mongoose')
/**
  * Route middlewares
*/
  , articleAuth = [auth.requiresLogin, auth.article.hasEditAuthorization]
  , commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization]
  , commentAuthToken = [auth.article.hasViewAuthorizationToken, auth.comment.hasAuthorization]
  , viewerAuth = [auth.requiresLogin, auth.article.hasViewAuthorization]
  , viewerAuthToken = [auth.article.hasViewAuthorizationToken]
  , userAuth = [auth.requiresLogin, auth.user.hasAuthorization]
  , orgAuth = [auth.requiresLogin, auth.org.hasAuthorization];

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
/**
 * Expose routes
 */

module.exports = function (app, passport) {

  // put user into res.locals for easy access from templates
  // This does not seem to do that.
  // app.get('*', function(req, res, next) {
  //   var userID=req.user?req.user._id:null;
  //   var criteria={
  //     'viewers':{$elemMatch: {user:userID}} 
  //   }
  //   Article.list(criteria, function(err, articles) {
  //     // var count = Article.count();
  //     // if (count > 0) {
  //     //   res.locals.received = "yes";
  //     // }
  //     // else {
  //     //   res.locals.received = "no";
  //     // }


  //     var total = articles.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal}) 

  //     console.log(total, articles.length)

  //     next();
  //   });
  // });



  // put user into res.locals for easy access from templates
  app.get('*', function(req, res, next) {
    var userID=req.user?req.user._id:null;
    Article.count({paidOn:null,'viewers':{$elemMatch: {user:userID} } }).exec(function(errR, countReceived){
        
        req.countReceived=countReceived;
        next()
    })//Count Inbox aka viewers
  });

  // user routes
  app.get('/login', auth.requiresNotLogin, users.login)
  app.get('/signup', auth.requiresNotLogin, users.signup)
  app.get('/logout', users.logout)
  app.get('/reset', users.resetpage)
  app.post('/reset', users.reset)

  app.param('pwResetID', users.loadreset)

  app.get('/reset/:pwResetID', users.resetPWpage)
  app.post('/reset/:pwResetID', users.resetPW)

  app.post('/users', users.create)
  app.post('/users/session', users.savepw,
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session)
 

  app.get('/settings',auth.requiresLogin, users.show)
  //app.get('/users/:userId',userAuth, users.show)
  app.get('/users/:userId/edit',userAuth, users.edit)
  app.put('/users/:userId',userAuth, users.update)
  app.post('/users/:userId/uploadimage',userAuth, users.uploadImage);//upload 


  app.param('orgId', organizations.org)


  app.get('/organizations/:orgId',orgAuth, organizations.show)
  app.post('/organizations',auth.requiresLogin, organizations.create)

  app.put('/organziations/:orgId',orgAuth, organizations.update)

  //app.get('/organizations/:orgId/edit',orgAuth, organizations.edit)
  app.post('/organizations/:orgId/uploadimage',orgAuth, organizations.uploadImage);//upload 
  app.post('/organziations/:orgId/addmember',orgAuth, organizations.addmember)
  app.delete('/organziations/:orgId/removemember',orgAuth, organizations.removemember)



  ///addresses api
  app.get('/users/:userId/addresses', users.addresses)


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
  app.param('id', articles.load)
  app.get('/articles/new', auth.requiresLogin, articles.new)
  //app.post('/articles', auth.requiresLogin, articles.create)

  app.param('token', articles.token)
  app.get('/articles/:id/token/:token', viewerAuthToken, articles.record, articles.show)
  app.get('/articles/:id', viewerAuth, articles.record, articles.show)
  app.get('/articles/:id/preview', viewerAuth, articles.record, function(req,res,next){ req.preview=true; next()}, articles.show)

  app.get('/articles/:id/edit', articleAuth, articles.edit)
  app.put('/articles/:id', articleAuth, articles.update)
  app.del('/articles/:id', articleAuth, articles.destroy)

  //articles.record
  app.post('/articles/:id/token/:token/payed', viewerAuthToken, articles.payed)
  app.post('/articles/:id/payed', viewerAuth, articles.payed)
  app.post('/articles/:id/uppayed', viewerAuth, articles.unpayed)

  app.post('/articles/:id/upload', articles.uploadcsv);//upload 
  app.post('/articles/:id/uploadimage', articles.uploadImage);//upload 





  

  // viewer routes
  var viewers = require('../app/controllers/viewers')
  app.param('viewerId', viewers.load)
  app.post('/articles/:id/viewer', articleAuth, viewers.create)
  app.post('/articles/:id/send', articleAuth, viewers.sendInvoice)
  app.del('/articles/:id/viewer/:viewerId', articleAuth, viewers.destroy)

  //payment made
  //app.post('/articles/:id/payed', viewerAuth, viewers.markAsPayed)
  //app.post('/articles/:id/verifyPayed', articleAuth, articles.verifiedAsPayed)

  //app.get('/articles/:id/viewer', articleAuth, viewers.share)
  app.get('/articles/:id/pdf/token/:token', viewerAuthToken, articles.pdf)
  app.get('/articles/:id/pdf', viewerAuth, articles.pdf)



  // home route
  app.get('/',  articles.homeOrSent)
  app.get('/sent', auth.requiresLogin, articles.indexSent)
  app.get('/recieved', auth.requiresLogin,  articles.indexRecieved)

  // Graph Api Route
  app.get('/api/graph', articles.graph);//upload 


  //table
  app.post('/tableview',  articles.tableJSONView);

  

  // comment routes
  var comments = require('../app/controllers/comments')
  app.param('commentId', comments.load)
  app.post('/articles/:id/comments', auth.requiresLogin, comments.create)
  app.post('/articles/:id/comments/:token', viewerAuthToken, comments.create)
  app.get('/articles/:id/comments', auth.requiresLogin, comments.create)
  app.del('/articles/:id/comments/:commentId', commentAuth, comments.destroy)
  app.del('/articles/:id/comments/:commentId/:token', commentAuthToken, comments.destroy)

  crudUtils.initRoutesForModel(app, auth);

  // tag routes (security risk)
  //var tags = require('../app/controllers/tags')
  //app.get('/tags/:tag', tags.index)

  app.get('/crud', function(req, res){
    res.render('crud')
  } );



}
