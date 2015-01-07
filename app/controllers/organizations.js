'use strict';
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Orgs = mongoose.model('Org')
  , utils = require('../../lib/utils')
  , crypto = require('crypto')
  , User = mongoose.model('User')
  , extend = require('util')._extend
  , sendEmail = utils.sendEmail
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost
  , fs = require('fs')
  , emailTmplPwReset = fs.readFileSync('./app/views/email/password_reset.html','utf8')
  , emailTmplPwResetConfirm = fs.readFileSync('./app/views/email/password_reset_confirm.html','utf8')
  , Mustache=require('mustache')
  , emailAddMemberTmpl = fs.readFileSync('./app/views/email/addmember.html','utf8');

// var login = function (req, res) {
//   var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
//   delete req.session.returnTo;
//   res.redirect(redirectTo);
// };

//exports.signin = function (req, res) {};

/**
 * Auth callback
 */

//exports.authCallback = login;


/**
 * Save pw in cookie and show in browser again.
 */
// exports.savepw = function (req, res, next) {
//     req.flash('savedbody',req.body);
//     next();
// };

/**
 * Show login form
 */

// exports.login = function (req, res) {
 
//   var savedbody = req.flash('savedbody'),
//       password = savedbody.length && savedbody[0].password?savedbody[0].password:'',
//       email = savedbody.length && savedbody[0].email?savedbody[0].email:'';

//   res.render('users/login', {
//     title: 'Login',
//     message: req.flash('error'),
//     password: password,
//     email: email,
//    // bodyClass: bodyClass
//   });
// };

/**
 * Show sign up form
 */

// exports.signup = function (req, res) {
//   //var bodyClass = "signup";
//   res.render('users/signup', {
//     title: 'Sign up',
//     //bodyClass: bodyClass,
//     user: new User()
//   });
// };

/**
 * Show reset form
 */

// exports.resetpage = function (req, res) {
//   var bodyClass = 'reset';
//   res.render('users/reset', {
//     title: 'Reset',
//     bodyClass: bodyClass,
//     message: req.flash('error')
//   });
// };


/**
 * Load Reset
 */

// exports.loadreset = function(req, res, next, resetid){
//   User.findOne({resetPasswordToken:resetid}, function(err,user){
//     req.user=user;
//     next();
//   });
// };

/**
 * Reset Passwors
 */

// exports.resetPWpage = function (req, res) {
//   var bodyClass = 'reset';
//   if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ 
//      req.flash('error', 'Password reset link invalid.');
//      return  res.redirect('/login');
//   }
//   res.render('users/resetpage', {
//     bodyClass: bodyClass,
//     title: 'Reset Password',
//     message: req.flash('error')
//   });
// };


/**
 * Reset Passwors
 */

// exports.resetPW = function (req, res) {
//   if (!req.user || new Date(req.user.resetPasswordExpires) < Date.now()){ return next(err)};
//   req.user.resetPasswordExpires=undefined;
//   req.user.resetPasswordToken=undefined;
//   req.user.hashed_password=req.user.encryptPassword(req.body.password);
//   req.user.save(function (err) {
//       var views={
//         user_full_name: req.user.firstname+' '+req.user.lastname
//       }
//       sendEmail({
//           to: req.user.email
//         , fromname: 'Ching.io' 
//         , from: 'noreply@ching.io'
//         , subject: 'Your Ching.io password has been reset'
//         , message: 'Dear '+req.user.firstname+' '+req.user.lastname+',%0AYour password has been reset'
//         , html:Mustache.render(emailTmplPwResetConfirm, views)
//       }, function(err, json, b){
//         req.logIn(req.user, function(err) {
//           if (err) return next(err)
//           req.flash('success', 'Your password has been reset!')
//           return res.redirect('/')
//         });//render
//       });//email
//   });//save
// };


/**
 * Reset Passwors
 */

// exports.reset = function (req, res, next) {

//   var email = req.body.email,
//       options = { email: email }
//   User.userEmail(options,function(err, user){
//         if (!user){
//           req.flash('error', 'No email found.')
//           return res.redirect('/reset')    
//         }
//         var email = user.email
//         //move to utility
//         crypto.randomBytes(20, function(err, buf) {
//           var token = buf.toString('hex');
//           user.resetPasswordToken=token;
//           user.resetPasswordExpires=Date.now() + 3600000;
//           user.save(function (err) {    
//             views={
//               reset_link: domain+'/reset/'+token
//               , user_full_name: user.firstname+' '+user.lastname
//             };   


//             sendEmail({
//                 to:email
//               , from: 'noreply@ching.io'
//               , message: domain+'/reset/'+token
//               , subject:'Reser your Ching.io Password'
//               , fromname:'Ching.io'
//               , html:Mustache.render(emailTmplPwReset, views)
//             }
//               , function(err, json){
//                 if (err){ return next(err)};
//                 req.flash('success', 'Check Your Email for a Reset Link. <br> Check you spam folder too.')
//                 res.redirect('/reset')            
//             });//Email Sent

//           });//User Saved
        
//         });//Token Made

//   })
// }

/**
 * Logout
 */

// exports.logout = function (req, res) {
//   req.logout()
//   res.redirect('/login')
// }

/**
 * Session
 */

//exports.session = login

/**
 * Create user
 */

// exports.create = function (req, res, next) {
//   // Check only when it is a new user or when email field is modified
//   User.findOne({ email: req.body.email }).exec(function (err, user) {
//       var newUser,
//       orgObj = {org: new Org({name:req.body.organization}), isAdmin:true };

//       if (!err && user && user.placeholderFromShare){ //Save over the placeholder
//          newUser = extend(user, req.body) //Combine the objects
//          newUser.placeholderFromShare=false; //Remove placeholder flag
//       } else if (!err && user){  //Already existis and not a placeholder
//           return res.render('users/signup', {
//             errors: utils.errors([{ message: 'Email already exists'}]),
//             user: user,
//             title: 'Sign up'
//           })
//       } else { //Brand spankin new so we make a new user
//           var user ={};
//           for (var key in req.body) {
//             user[key]=req.body[key]
//           };
//           if(req.body.organization){
//             user.organizations = [orgObj];
//             user.defautOrgIndex = 1;
//           }
//           newUser = new User(user)
//       }
//       newUser.provider = 'local'; //Set as local auth
//       orgObj.org.save(function (err) {
//       newUser.save(function (err) {
//         if (err){
//           return res.render('users/signup', {
//             errors: utils.errors(err.errors),
//             user: user,
//             title: 'Sign up'
//           })
//         }
//         // manually login the user once successfully signed up
//         req.logIn(newUser, function(err) {
//           if (err) return next(err)
//           return res.redirect('/')
//         })

//       })//save function newUser
//       })//save function Org
      
//   });//findone function
// }
// 
 exports.create = function (req, res) {
  var org = new Orgs({});

  org.save(function(err){
    if (err) return next(err);

    req.user.organizations.push({org:org.id, isAdmin:true})
    req.user.save(function(err){
      res.redirect('/organizations/'+org.id)
    });
  });
 };
 

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var bodyClass = "profile";
  var org = req.organization
  res.render('organization/show', {
    title: 'Organization',
    org: org,
    bodyClass: bodyClass
  })
}

/**
 * Find user by id
 */

exports.org = function (req, res, next, id) {

  User.orgMember(id, function(err, members){
      req.members = members
      if (err) return next(err)
      //if (members) return next(new Error('Failed to load Members ' + id))

    Orgs
      .findOne({ _id : id })
      .exec(function (err, org) {
        if (err) return next(err)
        if (!org) return next(new Error('Failed to load Org ' + id))
        req.organization = org
        next()
      });

  });
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

// exports.edit = function (req, res) {
//   var bodyClass = "profile";
//   var user = req.profile
//   res.render('users/edit', {
//     title: 'Edit Profile',
//     user: user,
//     bodyClass: bodyClass
//   })
// }



/**
 * Show edit
 */

exports.update = function (req, res, next) {
  var org = req.organization
  extend(org, req.body);
  org.save(function(err){
    if (err) return next(err)
      req.flash('success', 'Successfully Updated Your Organization!')
      return res.redirect('/organizations/'+org.id)
  })

}

/**
 * Add User
 */

exports.addmember = function (req, res) {
  var org = req.organization,
      validatedEmail = req.body.email.replace(/\.(?=[^@]*\@)/g, '');
      req.body.email = validatedEmail;

  User.findOne({email:validatedEmail})
      .exec(function (err, user) {
        if (user){
          var duplicate = user.organizations.some(function(val){
            console.log(val.org,org._id )
            return String(val.org)===org.id
          });
          if (!duplicate){
            user.organizations.push({
              org:org
            })            
          }

        } else{
          user = new User(req.body);
          user.placeholderFromShare=true;
          user.organizations.push({
              org:org
          });
          // user.save(function(){
          //   return res.redirect('/organizations/'+org.id)
          // });
        }
        user.save(function(){
          if (err) return next(err)
          //here we are sending the user an email to the new member
          var fromname = user.firstname +' '+user.lastname
              ,views={
            sender: fromname
            //, organization_article: user.organization?' at ':''
            //, organization: user.organization
            //, amount: utils.formatCurrency(article.total)
            //, invoice_num: utils.formatInvoiceNumber(article.number)
            , action_home: domain+'/organizations/'+org.id
            , action_href: domain+"?all="+org.name
            , organization: org.name
            , newURL: domain+'/articles/new/'
            , homeFeedURL: domain
            //, action_pdf_href: domain+'/articles/'+article.id+'/pdf/token/'+viewer._id
          }
           , subject = org.name+' '+req.user.firstname+req.user.lastname
           
          sendEmail({
              to: user.email
            , fromname: req.user.firstname +' '+req.user.lastname
            , from: 'noreply@ching.io'
            , subject: subject
            , html : Mustache.render(emailAddMemberTmpl, views)
            , message: 'You have been invited to the organization '+org.name+'. '+domain+'/organizations/'+org.id
            }, 
            function(err){
              console.log(err,'err')
              return res.redirect('/organizations/'+org.id)    
           });            
        });
      });
}

/**
 * Remove User
 */
exports.removemember = function (req, res) {
  var org = req.organization
  User.findOne({_id:req.body._id})
    .exec(function (err, user) {
      console.log(user)
      user.organizations.forEach(function(val){
      console.log(val.org, org._id)

        if (String(val.org)==org.id){
          user.organizations.pull(val)
        }
      });
      user.save(function(err){
        return res.redirect('/organizations/'+org.id)
      });
      
  });

}



/*
 * Upload Image
 */
exports.uploadImage = function(req, res){
  var org = req.organization;
  var files = req.files.files;

  if (!files || files.length===0){ return res.send([])};
  org.uploadAndSave(files, org.id, function(err) {
      console.log(err, 'save')

      if (!err) {
       return res.send({
        file: org.profileImageFile,
        cdn: org.profileImageCDN
       })
      }
    });

}