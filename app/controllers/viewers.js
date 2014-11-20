
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , utils = require('../../lib/utils')
  , User = mongoose.model('User')
  , utils = require('../../lib/utils')
  , sendEmail = utils.sendEmail
  , fs = require('fs')
  , emailTmpl = fs.readFileSync('./app/views/email/invoice.html','utf8')
  , Mustache=require('mustache')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost;

var Keen = require('keen.io');

var client = Keen.configure({
    projectId: "546dc37b36bca44b4bfcaf3e",
    writeKey: "8af6a1cc9a40021100e789f9010922a866fc7cafaeef7556217dd596738d779b0210ba1c45d11b5690865525fe9c05360e5aa344847617486eee4efe1a14575ecad3fce442b2c6c707c482b1c3a824914a216f64c76da2afbcde668c0095788281eb33f6c286678e43ad328eb0996717",
    readKey: "f631dfd829dba39d1d8efa8b22b6397ba7276991180db8733dbf354d2b645ef4b916bb3e71b9f6309a6181664a5ab2fb823cfdc3a3adec14a6e30dcbcb9783054cbdb4d8b5d1e97c14fca2a0a78abd793184a018057dd9e8b997196bd619984fb2ff3faa93a37580976b86b24658c1d2",
    masterKey: "56431B491A7ADDAA1DACA079F6165952"
});

var Analytics = function(collection, keyVals, cb){
  client.addEvent(collection, keyVals, function(err, res) {
    if (err && cb) {
      cb(err, null)
        console.log("Oh no, an error!", err);
    } else if (cb) {
      cb(null, res)
    }
  });
}


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

  Analytics('event', {type:'new_recipient', user:req.user.id});

  var article = req.article,
      user = req.user,
      duplicate,
      user,
      validatedEmail = req.body.email.replace(/\.(?=[^@]*\@)/g, '');

      console.log(req.body.email)

  if (!req.body.email || req.body.email.length===0){
        req.flash('error', 'No email')
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

  Analytics('event', {type:'invoice_sent', user:req.user.id});

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
  //console.log(emailTmpl)
  //

  articleJSON.viewers.forEach(function(viewer, i){
        var views={
            sender: viewer.user.firstname +' '+ viewer.user.lastname
          , organization_article: user.organization?' with ':''
          , organization: user.organization
          , amount: utils.formatCurrency(article.total)
          , invoice_num: utils.formatInvoiceNumber(article.number)
          , main_p: "Your Invoice total is "+utils.formatCurrency(article.total)
          , action_href: domain+'/articles/'+article.id+'/token/'+viewer._id
        }
        , subject = 'Invoice #'+utils.formatInvoiceNumber(article.number)+' from '+viewer.user.firstname +' '+ viewer.user.lastname
        ,fromname = user.firstname +' '+user.lastname

        if (user.organization && user.organization.length>0){///Organization is optional.  this logic add it when we have it
          subject+=' with '+user.organization;
          fromname+=' ('+user.organization+')';
        };

        
        sendEmail({
            to: viewer.user.email
          , fromname: fromname 
          , from: 'noreply@ching.io'
          , subject: subject
          , html : Mustache.render(emailTmpl, views)
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
            req.flash('success', 'Invoice Sent to '+articleJSON.viewers.length+' people.')
            res.redirect('/articles/'+ article.id)            
          }
        });//email
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
