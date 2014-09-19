
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , crypto = require('crypto')
  , User = mongoose.model('User')
  , extend = require('util')._extend
  , sendEmail = utils.sendEmail;


var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/'
  delete req.session.returnTo
  res.redirect(redirectTo)
}

exports.signin = function (req, res) {}

/**
 * Auth callback
 */

exports.authCallback = login

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login',
    message: req.flash('error')
  })
}

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  res.render('users/signup', {
    title: 'Sign up',
    user: new User()
  })
}

/**
 * Show reset form
 */

exports.resetpage = function (req, res) {
  res.render('users/reset', {
    title: 'Reset',
    message: req.flash('error')
  })
}


/**
 * Load Reset
 */

exports.loadreset = function(req, res, next, resetid){

  User.findOne({resetPasswordToken:resetid}, function(err,user){
    req.user=user;
    next()
  })
}

/**
 * Reset Passwors
 */

exports.resetPWpage = function (req, res) {
  if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ return next(err)};
  res.render('users/resetpage', {
    title: 'Reset Password',
    message: req.flash('error')
  })

}


/**
 * Reset Passwors
 */

exports.resetPW = function (req, res) {
  if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ return next(err)};
  req.user.resetPasswordExpires=undefined
  req.user.resetPasswordToken=undefined
  req.user.hashed_password=req.user.encryptPassword(req.body.password)
  req.user.save(function (err) {
      sendEmail({
        email:req.user.email,
        message: 'Your password has been reset'
      }, function(err, json, b){
        req.logIn(req.user, function(err) {
          if (err) return next(err)
          return res.redirect('/')
        });//render
      });//email
  });//save
};


/**
 * Reset Passwors
 */

exports.reset = function (req, res) {

  var email = req.body.email,
      options = {
        crtieria : { email: email }
      }
  User.userEmail(options,function(err, user){

     // if (!user){return next(err);}

        var email = user.email
       
        //move to utility
        crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        

          
          user.resetPasswordToken=token;
          user.resetPasswordExpires=Date.now() + 3600000;
          user.save(function (err) {
            //hard coded I know clean up! (localhost:4000)
            sendEmail({email:email, message: 'http://localhost:4000/reset/'+token}, function(err, json, b){

                res.render('users/reset', {
                          title: 'Reset',
                          success: ['Check Your Email for a Reset Link']
                })


                      
            
            });//Email Sent

          });//User Saved
        
        });//Token Made



        

  })
}

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout()
  res.redirect('/login')
}

/**
 * Session
 */

exports.session = login

/**
 * Create user
 */

exports.create = function (req, res) {



  // Check only when it is a new user or when email field is modified
  User.findOne({ email: req.body.email }).exec(function (err, user) {
      var newUser
      if (!err && user && user.placeholderFromShare){ //Save over the placeholder
         newUser = extend(user, req.body) //Combine the objects
         newUser.placeholderFromShare=false; //Remove placeholder flag
      } else if (!err && user){  //Already existis and not a placeholder
          return res.render('users/signup', {
            errors: utils.errors([{ message: 'Email already exists'}]),
            user: user,
            title: 'Sign up'
          })
      } else { //Brand spankin new so we make a new user
          newUser = new User(req.body)
      }
      newUser.provider = 'local' //Set as local auth
      newUser.save(function (err) {
        if (err){
          return res.render('users/signup', {
            errors: utils.errors(err.errors),
            user: user,
            title: 'Sign up'
          })
        }
        // manually login the user once successfully signed up
        req.logIn(user, function(err) {
          if (err) return next(err)
          return res.redirect('/')
        })

      })//save function
      
  });//findone function

}

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var user = req.profile
  res.render('users/show', {
    title: user.name,
    user: user
  })
}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  User
    .findOne({ _id : id })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    })
}
