/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , utils = require('../../lib/utils')
  , validateEmail = utils.validateEmail
  , extend = require('util')._extend;




/**
 * Load
 */

exports.load = function(req, res, next, id){
  var User = mongoose.model('User')
  Article.load(id, function (err, article) {
    if (err) return next(err)
    if (!article) return next(new Error('not found'))
    req.article = article
    next()
  })
}

/**
 * Token
 */

exports.token  = function(req, res, next, token){
  var User = mongoose.model('User')
  req.token=token;
  next();
}


/**
 * List
 */

exports.indexRecieved = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30,
      userID=req.user?req.user._id:null;
  var options = {
    perPage: perPage,
    page: page,
  }
  options.criteria={
    'viewers':{$elemMatch: {user:userID}} 
  }


  Article.list(options, function(err, articles) {

    if (err) return res.render('500')
    Article.count().exec(function (err, count) {
      res.render('articles/index', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * List
 */

exports.indexSent = function(req, res){
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30,
      userID=req.user?req.user._id:null;
  var options = {
    perPage: perPage,
    page: page,
  }
  options.criteria={
    user: userID
  }

  console.log(userID)

  Article.list(options, function(err, articles) {
    console.log(err)
    if (err) return res.render('500')
    Article.count().exec(function (err, count) {
      res.render('articles/index', {
        title: 'Articles',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}

/**
 * New article
 */

exports.new = function(req, res){
  res.render('articles/new', {
    title: 'New Article',
    article: new Article({})
  })
}

/**
 * Update article
 */

// exports.updateShare = function(req, res){
//   var article = req.article

//   console.log(req.body.viewers)
//   console.log(article.viewers)


// //  article.viewers.push(req.body.email);

//   //var viewers = req.body.viewers.split(',');

//   // for (var i = viewers.length - 1; i >= 0; i--) {
//   //   var index=article.viewers.indexOf(viewers[i])

//   //   if (index==-1){
//   //       article.viewers.push(viewers[i]);
//   //   } 
//   // };

//   // for (var i = article.viewers.length - 1; i >= 0; i--) {
//   //   var index=viewers.indexOf( String(article.viewers[i]) )

//   //   if (index==-1){
//   //       console.log(typeof article.viewers[i],article.viewers[i])

//   //       // article.viewers.splice(i,i);
//   //   } 
//   // };
  
//   article.save(function(err){
//   //article.uploadAndSave(req.files.image, function(err) {
//     // if (!err) {
//     //   return res.redirect('/articles/' + article._id)
//     // }
//     console.log(err)

//     res.render('articles/share', {
//       title: 'Edit ' + req.article.title,
//       article: article,
//       error: err?utils.errors(err.errors || err):null
//     })
//   })
// }

/**
 * Create an article
 */

exports.create = function (req, res) {
  var article = new Article(req.body)
  article.user = req.user

  article.save(function (err) {
    console.log(err)
    if (!err) {
      req.flash('success', 'Successfully created article!')
      return res.redirect('/articles/'+article._id)
    }

    res.render('articles/new', {
      title: 'New Article',
      article: article,
      error: utils.errors(err.errors || err)
    })
  })
}

/**
 * Edit an article
 */

exports.edit = function (req, res) {
  res.render('articles/edit', {
    title: 'Edit ' + req.article.title,
    article: req.article
  })
}

/**
 * Update article
 */

exports.update = function(req, res){
  var article = req.article
  console.log(req.body,article)

  article = extend(article, req.body)

  article.save(function(err) {
    if (!err) {
      return res.redirect('/articles/' + article._id)
    }

    res.render('articles/edit', {
      title: 'Edit Article',
      article: article,
      error: utils.errors(err.errors || err)
    })
  })
}

/**
 * Show
 */

exports.show = function(req, res, next){
  res.render('articles/show', {
    title: req.article.title,
    article: req.article
  })
}

/**
 * Record View
 */

exports.record = function(req, res, next){
  var article = req.article
    , viewer  = req.articleViewer
    , user = req.user
    , userId = viewer && viewer.user.id? viewer.user._id:user.id;

    if (user && article.user.id===user.id){
      return next();
    }

    article.addPageView({user:userId}, function (err, obj, newViewer) {
      if (err) return res.render('500')
      next()
    });
}

/**
 * Delete an article
 */

exports.destroy = function(req, res){
  var article = req.article
  article.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/articles')
  })
}
/**
 * Home page
 */

exports.home = function(req, res){
  res.render('articles/home', {
    title: 'Home',
  })
}
