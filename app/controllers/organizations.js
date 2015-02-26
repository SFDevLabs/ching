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
  , Mustache=require('mustache')
  , emailAddMemberTmpl = utils.createEmail('./app/views/email/addmember.html') 
  , emailAddNewMemberTmpl = utils.createEmail('./app/views/email/addmemberNewUser.html');

/**
 *  create org
 */

 exports.create = function (req, res) {
  var org = new Orgs({});

  org.save(function(err){
    if (err) return next(err);
    var data = {
        type:'new_org'
      , user:req.user.id?req.user.id:''
      , session:req.sessionID?req.sessionID:null
      }
    utils.keenAnalytics('user_event', data);///Send data to the analytics engine
    req.user.organizations.push({org:org.id, isAdmin:true})
    req.user.save(function(err){
      res.redirect('/organizations/'+org.id+'?type=edit')
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

        var emailTmpl;
        if (user){
          emailTmpl= emailAddMemberTmpl;
          var duplicate = user.organizations.some(function(val){
            return String(val.org)===org.id
          });
          if (!duplicate){
            user.organizations.push({
              org:org
            })            
          }

        } else{
          emailTmpl= emailAddNewMemberTmpl;
          var user = new User(req.body);
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
          var fromname = req.user.firstname +' '+req.user.lastname
              ,views={
            sender: fromname
            //, organization_article: user.organization?' at ':''
            //, organization: user.organization
            //, amount: utils.formatCurrency(article.total)
            //, invoice_num: utils.formatInvoiceNumber(article.number)
            , action_signup : domain+'/signup?email='+user.email
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
            , html : Mustache.render(emailTmpl, views)
            , message: 'You have been invited to the organization '+org.name+'. '+domain+'/organizations/'+org.id
            }, 
            function(err){
              var data = {
                  type:'new_org_member'
                , user:req.user.id?req.user.id:''
                , session:req.sessionID?req.sessionID:null
                }
              utils.keenAnalytics('user_event', data);///Send data to the analytics engine
              req.flash('success', 'New user added to the Organization! An email has been sent to the user informing them. ');
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
        req.flash('success', 'User Has been removed from the organization.');
        return res.redirect('/settings')
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