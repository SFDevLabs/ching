
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
  var article = req.article,
      user = req.user,
      duplicate;

  req.article.viewers.every(function(val,i){
    if (String(req.body.user)===String(val.user._id)){
      duplicate=true
    }
  });

  if (duplicate){
    req.flash('error', 'Duplicate viewer')
    res.redirect('/articles/' + article.id+'/viewer')
  } else{
    article.addViewer(req.body, function (err) {
      if (err) return res.render('500')
      req.flash('success', 'New Viewer Added!')
      res.redirect('/articles/'+ article.id+'/viewer')
    })
  }
}

/**
 * Delete viewers
 */

exports.destroy = function (req, res) {
  var article = req.article
  console.log(req.param('viewerId'))
  article.removeViewer(req.param('viewerId'), function (err) {
    console.log(err)
    if (err) {
      req.flash('error', 'Oops! The viewer was not found')
    } else {
      req.flash('success', 'Removed viewer')
    }
    res.redirect('/articles/' + article.id+'/viewer')
  })
}


/**
 * Share article
 */


exports.share = function (req, res) {
  res.render('articles/share', {
    title: 'Edit ' + req.article.title,
    article: req.article
  })
}
