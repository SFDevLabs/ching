'use strict';
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Org = mongoose.model('Org')
  , utils = require('../../lib/utils')
  , crypto = require('crypto')
  , User = mongoose.model('User')
  , extend = require('util')._extend
  , sendEmail = utils.sendEmail
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost
  , fs = require('fs')
  , emailTmplPwReset = utils.createEmail('./app/views/email/password_reset.html') //fs.readFileSync('./app/views/email/password_reset.html','utf8')
  , emailTmplPwResetConfirm = utils.createEmail('./app/views/email/password_reset_confirm.html') //fs.readFileSync('./app/views/email/password_reset_confirm.html','utf8')
  , createUserEmail = utils.createEmail('./app/views/email/createUser.html') 
  , Mustache=require('mustache');

var login = function (req, res) {
  var name = req.user.firstname?req.user.firstname:'';
  utils.slackChing(name+'has loged in');
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

exports.signin = function (req, res) {};

/**
 * Auth callback
 */

exports.authCallback = login;


/**
 * Save pw in cookie and show in browser again.
 */
exports.savepw = function (req, res, next) {
    req.flash('savedbody',req.body);
    next();
};

/**
 * Show login form
 */

exports.login = function (req, res) { 
  var savedbody = req.flash('savedbody'),
      password = savedbody.length && savedbody[0].password?savedbody[0].password:'',
      email = savedbody.length && savedbody[0].email?savedbody[0].email:'';

  res.render('users/login', {
    title: 'Login',
    message: req.flash('error'),
    password: password,
    email: email,
   // bodyClass: bodyClass
  });
};

/**
 * Show sign up form
 */

exports.signup = function (req, res) {
  //var bodyClass = "signup";
  res.render('users/signup', {
    title: 'Sign up',
    //bodyClass: bodyClass,
    user: new User()
  });
};

/**
 * Show reset form
 */

exports.resetpage = function (req, res) {
  var bodyClass = 'reset';
  res.render('users/reset', {
    title: 'Reset',
    bodyClass: bodyClass,
    message: req.flash('error')
  });
};


/**
 * Load Reset
 */

exports.loadreset = function(req, res, next, resetid){

  User.findOne({resetPasswordToken:resetid}, function(err,user){
    req.user=user;
    next();
  });
};

/**
 * Reset Passwors
 */

exports.resetPWpage = function (req, res) {
  var bodyClass = 'reset';
  if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ 
     req.flash('error', 'Password reset link invalid.');
     return  res.redirect('/login');
  }
  res.render('users/resetpage', {
    bodyClass: bodyClass,
    title: 'Reset Password',
    message: req.flash('error')
  });

};


/**
 * Reset Passwors
 */

exports.resetPW = function (req, res) {
  if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ return next(err)};
  req.user.resetPasswordExpires=undefined;
  req.user.resetPasswordToken=undefined;
  req.user.hashed_password=req.user.encryptPassword(req.body.password);
  req.user.save(function (err) {
      var views={
        user_full_name: req.user.firstname+' '+req.user.lastname
      }
      sendEmail({
          to: req.user.email
        , fromname: 'Ching.io' 
        , from: 'noreply@ching.io'
        , subject: 'Your Ching.io password has been reset'
        , message: 'Dear '+req.user.firstname+' '+req.user.lastname+',%0AYour password has been reset'
        , html:Mustache.render(emailTmplPwResetConfirm, views)
      }, function(err, json, b){
        req.logIn(req.user, function(err) {
          if (err) return next(err)
          req.flash('success', 'Your password has been reset!')
          return res.redirect('/')
        });//render
      });//email
  });//save
};


/**
 * Reset Passwors
 */

exports.reset = function (req, res, next) {

  var email = req.body.email,
      options = { email: email }
  User.userEmail(options,function(err, user){
        if (!user){
          req.flash('error', 'No email found.')
          return res.redirect('/reset')    
        }
        var email = user.email
        //move to utility
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          user.resetPasswordToken=token;
          user.resetPasswordExpires=Date.now() + 3600000;
          user.save(function (err) {    
            var views={
              reset_link: domain+'/reset/'+token
              , user_full_name: user.firstname+' '+user.lastname
            };   


            sendEmail({
                to:email
              , from: 'noreply@ching.io'
              , message: domain+'/reset/'+token
              , subject:'Reser your Ching.io Password'
              , fromname:'Ching.io'
              , html:Mustache.render(emailTmplPwReset, views)
            }
              , function(err, json){
                if (err){ return next(err)};
                req.flash('success', 'Check Your Email for a Reset Link. <br> Check you spam folder too.')
                res.redirect('/reset')            
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

exports.create = function (req, res, next) {

  // Check only when it is a new user or when email field is modified
  User.findOne({ email: req.body.email }).exec(function (err, user) {
      var newUser,
      orgObj = {org: new Org({name:req.body.organization}), isAdmin:true };

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
          var user ={};
          for (var key in req.body) {
            user[key]=req.body[key]
          };
          if(req.body.organization){
            user.organizations = [orgObj];
            user.defautOrgIndex = 1;
          }
          newUser = new User(user)
      }
      newUser.provider = 'local'; //Set as local auth
      orgObj.org.save(function (err) {
      newUser.save(function (err) {
        if (err){
          return res.render('users/signup', {
            errors: utils.errors(err.errors),
            user: user,
            title: 'Sign up'
          })
        }
        var views={
            user_full_name: user.firstname+' '+user.lastname
          , new_action:domain+'/articles/new'
          , profile_action: domain+'/articles/new'
        }
        sendEmail({
            to: user.email
          , fromname: 'Ching.io' 
          , from: 'noreply@ching.io'
          , subject: 'Welcome to Ching'
          , message: 'Dear '+user.firstname+' '+user.lastname+',%0AYour password has been reset'
          , html:Mustache.render(createUserEmail, views)
        }, function(err, json, b){
          utils.slackChing(req.user.firstname+'has signed up, Horray');
          // manually login the user once successfully signed up
          req.logIn(newUser, function(err) {
            if (err) return next(err)
            return res.redirect('/')
          });

        });//email



      })//save function newUser
      })//save function Org
      
  });//findone function
}

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var bodyClass = "profile";
  var user = req.user
  User
    .findOne({ _id : user.id })
    .populate('organizations.org')
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      res.render('users/show', {
        title: 'Profile',
        user: user,
        bodyClass: bodyClass
      });
    })


}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  User
    .findOne({ _id : id })
    .populate('organizations.org')
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    })
}


/**
 * Search for users by email
 */

exports.addresses = function (req, res) {
  User
    .find({ email : /jeff/i },"firstname lastname organization email")
    .exec(function (err, results) {
      if (err) return next(err)
      
        res.send(results)

    })
}


/**
 * Show edit
 */

exports.edit = function (req, res) {
  var bodyClass = "profile";
  var user = req.profile
  res.render('users/edit', {
    title: 'Edit Profile',
    user: user,
    bodyClass: bodyClass
  })
}



/**
 * Show edit
 */

exports.update = function (req, res, next) {
  var user = req.profile
  extend(user, req.body);
  user.save(function(err){
    if (err) return next(err)
      req.flash('success', 'Successfully Updated Your Profile!')
      return res.redirect('/users/'+user.id)
  })

}

/*
 * Upload Image
 */
exports.uploadImage = function(req, res){
  var user = req.user;
  var files = req.files.files;

  if (!files || files.length===0){ return res.send([])};
  user.uploadAndSave(files, req.user.id, function(err) {
        console.log(err, 'save')

      if (!err) {
       return res.send({
        file: user.profileImageFile,
        cdn: user.profileImageCDN
       })
      }
    });

}