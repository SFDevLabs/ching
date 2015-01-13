
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , utils = require('../../lib/utils')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , sendEmail = utils.sendEmail
  , fs = require('fs')
  , invoiceEmailTmpl = utils.createEmail('./app/views/email/invoice.html') 
  , Mustache=require('mustache')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost;

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

  utils.keenAnalytics('user_event', {type:'invoice_new_recipient', user:req.user.id, session:req.sessionID?req.sessionID:null});

  var article = req.article,
      user = req.user,
      duplicate,
      user,
      validatedEmail = req.body.email.replace(/\.(?=[^@]*\@)/g, ''),
      emailValidation = utils.validateEmail(req.body.email);
      console.log(req.body.email)

  if (!req.body.email || req.body.email.length===0 || !emailValidation){
        req.flash('error', 'Please enter a valid email')
        return res.redirect('/articles/' + article.id)
  }

  User.findOne({email: validatedEmail}, function(err, user){
       if (!user){
         req.body.placeholderFromShare=true
         user = new User(req.body);
         user.save();//create a new user
       } else {
       // req.flash('info', 'We found ching user with this email!'); ///inform the use that 
        duplicate = req.article.viewers.some(function(val,i){//Check to see if we have already shared with this person
          if (String(user._id)===String(val.user._id)){
            return true
          } 
        })
      }
      if (duplicate){
          req.flash('warning', 'This email address is already on the invoice.')
          res.redirect('/articles/' + article.id)
      } else {
      article.addViewer({user:user._id}, function (err, obj, newViewer) {
        if (err) return res.render('500')
          req.flash('success', 'New Viewer Added!')
          res.redirect('/articles/'+ article.id)
      });//viewer added

      }
  });
}

exports.sendInvoice=function(req, res){

  utils.keenAnalytics('user_event', {type:'invoice_sent', user:req.user.id, session:req.sessionID?req.sessionID:null });

    //         , 

  var   article= req.article
      , articleJSON = article.toJSON()
      , user = req.user
      , sent  = [];
      
  if (!articleJSON.viewers.length){
     req.flash('error', 'Oops! Please add at least ONE recipient to your invoice.');
     return res.redirect('/articles/' + article.id);
  }



  // sendEmail({
  //           to:articleJSON.viewers[0].user.email
  //           , subject: 'You have a new Invoice from '+user.organization
  //           , from: 'noreply@ching.io'
  //           ,html:Mustache.render(emailTmpl, views)//
  //         }, function(err, json){
  //           console.log(err, json)
  //         })


  // we should create token here for each time we send the invoice! see authorization js line 67
  articleJSON.viewers.forEach(function(viewer, i){
        var fromname = user.firstname +' '+user.lastname,
            views={
              sender: fromname
            , organization_article: user.organization?' at ':''
            , organization: user.organization
            , amount: utils.formatCurrency(article.total)
            , invoice_num: utils.formatInvoiceNumber(article.number)
            , action_href: domain+'/articles/'+article.id+'/token/'+viewer._id
            , action_pdf_href: domain+'/articles/'+article.id+'/pdf/token/'+viewer._id
          }
          , subject = 'Invoice #'+utils.formatInvoiceNumber(article.number)+' from '+viewer.user.firstname +' '+ viewer.user.lastname

        if (user.organization && user.organization.length>0){///Organization is optional.  this logic add it when we have it
          subject+=' at '+user.organization;
          fromname+=' ('+user.organization+')';
        };

        
        sendEmail({
            to: viewer.user.email
          , fromname: fromname 
          , from: 'noreply@ching.io'
          , subject: subject
          , html : Mustache.render(invoiceEmailTmpl, views)
          , message: 'Your invoice can be viewed at '+domain+'/articles/'+article.id+'/token/'+viewer._id
        }, function(err, json){
          if (err){   
             req.flash('error', 'Oops! The invoices could not be sent');
             return res.redirect('/articles/' + article.id)
          };
          sent.push(json)
          if (sent.length===articleJSON.viewers.length){
            article.invoicedOn=new Date();
            article.save();
            req.flash('success', 'Success! '+articleJSON.viewers.length+' recipent(s) will recieve invoices.')
            res.redirect('/articles/'+ article.id)            
          }
        });//email
  });
}

/**
 * Delete viewers
 */

exports.destroy = function (req, res) {
  utils.keenAnalytics('user_event', {type:'invoice_destroy', user:req.user.id, session:req.sessionID?req.sessionID:null});

  var article = req.article
  console.log(req.param('viewerId'))
  article.removeViewer(req.param('viewerId'), function (err) {
    console.log(err)
    if (err) {
      req.flash('error', 'Oops! The viewer was not found')
    } else {
      req.flash('success', 'Invoice recipient removed.')
    }
    res.redirect('/articles/' + article.id)
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
