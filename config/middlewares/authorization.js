
/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  if (req.isAuthenticated()) return next()
  if (req.method == 'GET') req.session.returnTo = req.originalUrl
  res.redirect('/login')
}

/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization: function (req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/users/' + req.profile.id)
    }
    next()
  }
}

/*
 *  Article authorization routing middleware
 */

exports.article = {
  hasEditAuthorization: function (req, res, next) {
    if (req.article.user.id != req.user.id) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/articles/' + req.article.id)
    }
    next()
  },
  hasEditAuthorizationAPI: function (req, res, next) {
    if (req.article.user.id != req.user.id) {
      return res.send(401,'{"status":"Not Authroized"}')
    }
    next()
  },
  hasUserAuthorization:function (req, res, next) {
    if (req.article.user.id != req.user.id) {
      return res.send(401,'{"status":"Not Authroized"}')
    }
    next()
  },
  hasViewAuthorization: function (req, res, next) {
    var viewerAuth
      , authorAuth;
    // auth = req.article.user.id !== req.user.id;

    viewerAuth = req.article.viewers.some(function(val, i){
        return val.user.id === req.user.id
    });
    authorAuth = req.article.user.id === req.user.id
    if (!viewerAuth && !authorAuth) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/login')
    }
    next()
  },
  hasViewAuthorizationToken:function(req, res, next){
    var auth = req.article.viewers.some(function(user,i){//iterate through the viewers with 'some' and return true if we have a valid token to view the invoice
      if (req.token===user.id){
        req.user=user;
        return true
      };
    });
    if (!auth) {
      req.flash('info', 'You are not authorized')
      return res.redirect('/login')
    }
    next();
  }
}

/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: function (req, res, next) {
    // if the current user is comment owner or article owner
    // give them authority to delete
    if (req.user.id === req.comment.user.id || req.user.id === req.article.user.id) {
      next()
    } else {
      req.flash('info', 'You are not authorized')
      res.redirect('/articles/' + req.article.id)
    }
  }
}
