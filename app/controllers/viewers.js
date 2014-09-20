
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , utils = require('../../lib/utils')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , sendEmail = utils.sendEmail;
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
      duplicate,
      user,
      validatedEmail = req.body.email.replace(/\.(?=[^@]*\@)/g, '');

      console.log(req.body.email)

  if (!req.body.email || req.body.email.length===0){
        req.flash('error', 'No email')
        return res.redirect('/articles/' + article.id+'/viewer')
  }

  User.findOne({email: validatedEmail}, function(err, user){
       if (!user){
         user = new User({email:req.body.email, placeholderFromShare:true});
         user.save();//create a new user
       } else {
        duplicate = req.article.viewers.some(function(val,i){
          if (String(user._id)===String(val.user._id)){
            return true
          } 
        })
      }
      if (duplicate){
        req.flash('error', 'Duplicate viewer')
        res.redirect('/articles/' + article.id+'/viewer')
      } else {

      article.addViewer({user:user._id}, function (err, obj, newViewer) {
        if (err) return res.render('500')

        sendEmail({
          email:user.email
          , message: 'You invoice can be viewed at http://localhost:4000/articles/'+article.id+'/token/'+newViewer[0].id
          , subject: 'You have a new Invoice'
        }, function(err, json){
          if (err) return res.render('500')
          req.flash('success', 'New Viewer Added!')
          res.redirect('/articles/'+ article.id+'/viewer/')
        });//email

      });//viewer added


      }
  });
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
      req.flash('success', 'Viewer Removed')
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
