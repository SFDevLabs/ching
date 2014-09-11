
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
var utils = require('../../lib/utils')

/**
 * Load viewers
 */

exports.load = function (req, res, next, id) {
  var article = req.article
  utils.findByParam(article.viewers, { id: id }, function (err, viewer) {
    //console.log(err,viewer)
    if (err) return next(err)
    req.viewer = viewer
    next()
  })
}

/**
 * Create viewers
 */

exports.create = function (req, res) {
  var article = req.article
  var user = req.user

  //if (!req.body.body) return res.redirect('/articles/'+ article.id)

  article.addViewer(user, req.body, function (err) {
    if (err) return res.render('500')
    res.redirect('/articles/'+ article.id+'/share')
  })
}

/**
 * Delete viewers
 */

exports.destroy = function (req, res) {
  var article = req.article
  console.log(req.param('viewerId'))
  article.removeViewer(req.param('viewerId'), function (err) {
    if (err) {
      req.flash('error', 'Oops! The viewer was not found')
    } else {
      req.flash('info', 'Removed viewer')
    }
    res.redirect('/articles/' + article.id+'/share')
  })
}
