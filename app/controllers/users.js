
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , crypto = require('crypto');

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
  var User = mongoose.model('User');

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

//move to utility
var sendEmail;
exports.sendEmail = sendEmail= function(obj, cb){

  if (!obj.email && typeof obj.email !=='string'){cb('No Valid Email')}

                   // console.log(obj)

     sendgrid.send({
      to:       obj.email,
      from:     obj.from?obj.from:"None",
      subject:  obj.subject?obj.subject:"None",
      text:     obj.message?obj.message:"None"
    }, function(err, json, b) {
      // if (err) { 
      //   cb(err)
      // }

      cb(null, json, b)
    });
     
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
  var user = new User(req.body)
  user.provider = 'local'
  user.save(function (err) {
    console.log(err)
    if (err) {
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
  })
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
