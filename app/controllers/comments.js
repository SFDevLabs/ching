
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var utils = require('../../lib/utils')

/**
 * Load comment
 */

exports.load = function (req, res, next, id) {
  var article = req.article
  utils.findByParam(article.comments, { id: id }, function (err, comment) {
    if (err) return next(err)
    req.comment = comment
    next()
  })
}

/**
 * Create comment
 */

exports.create = function (req, res) {
  var data = {
      type:'create_comment'
    , user:req.user.id
    , session:req.sessionID?req.sessionID:null
    }
  utils.keenAnalytics('user_event', data);///Send data to the analytics engine
  var article = req.article
    , user = req.user;
  if (!req.body.body) return res.redirect('/articles/'+ article.id)
    article.addComment(user, req.body, function (err) {
    //hacky logic
    redirect=req.token?'/articles/'+ article.id+'/token/'+req.token:'/articles/'+ article.id;
    if (err) return res.render('500')
    res.redirect(redirect)
  })
}

/**
 * Delete comment
 */

exports.destroy = function (req, res) {
  var article = req.article
  var data = {
      type:'destroy_comment'
    , user:req.user.id
    , session:req.sessionID?req.sessionID:null
    }
  utils.keenAnalytics('user_event', data);///Send data to the analytics engine
  article.removeComment(req.param('commentId'), function (err) {
    if (err) {
      req.flash('error', 'Oops! The comment was not found')
    } else {
      req.flash('info', 'Removed comment')
    }
    var redirect='/articles/' + article.id
    if (req.token){redirect+='/token/'+req.token}
    res.redirect(redirect)
  })
}
