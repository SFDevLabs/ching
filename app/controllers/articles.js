/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , User = mongoose.model('User')
  , Org = mongoose.model('Org')
  , authorization = require('../../config/middlewares/authorization.js')
  , utils = require('../../lib/utils')
  , csvParse = require('../../utils/csvParse')
  , validateEmail = utils.validateEmail
  , extend = require('util')._extend
  , Converter=require("csvtojson").core.Converter
  , sendEmail = utils.sendEmail
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost
  , emailTmplPaid = utils.createEmail('./app/views/email/paid.html')
  , emailTmplPaidVerified = utils.createEmail('./app/views/email/paidVerified.html')
  , emailTmplOverdue = utils.createEmail('./app/views/email/overdue.html')
  , invoiceFirstViewed = utils.createEmail('./app/views/email/firstviewed.html')
  , Mustache = require('mustache')
  , async = require('async')
  , itemsSchema = require('../models/article').itemsSchemaExport()
  , _ = require("underscore")
  , CronJob = require('cron').CronJob;

var job = new CronJob('00 00 11 * * *', function(){ // 
    var date = new Date(); //now
    var dateMinus = new Date(); //24 hours ago
    dateMinus.setHours(date.getHours() - 25);//25 hours ago
    //queary for things that went past due 24 hours ago
    Article.find({paidOn:null,invoicedOn:{'$ne': null }, dueOn:{$gt: dateMinus, $lt:date}},{number:1, user:1})
          .populate('user','email')
          .exec(function(err, results){
              if (err){ return console.log(err)};
              overdueMonitorEmail(results);
              console.log(results)
              results.forEach(function(result){
                //console.log(result)
                overdueEmail(result)
              });
    });
  }, function () {
    // This function is executed when the job stops
  },
  true /* Start the job right now */
);

var overdueMonitorEmail = function(results){
              var resultNum=results?results.length:''
              sendEmail({ to: 'jenkinsjeffrey@gmail.com'
                        , from: 'noreply@ching.io'
                        , subject:resultNum+" overdue notices send to users. The domain that sent this is:"+domain+' '+Date()
                        , text: resultNum+" overdue notices send to users. The domain that sent this is:"+domain+' '+Date()
                      },function(err){
                        //console.log(err, 'email')
                        //email error goes here
                      });
}

var overdueEmail = function(article){
  var views={
          invoice_num: utils.formatInvoiceNumber(article.number)
        , action_href: domain+'/articles/'+article.id
  };
  sendEmail({to: article.user.email
          , fromname : 'Ching'
          , from: 'noreply@ching.io'
          , subject: 'Invoice #'+utils.formatInvoiceNumber(article.number)+' is overdue'
          , html : Mustache.render(emailTmplOverdue, views)
          , text: 'You can visit the invoice here: '+domain+'/articles/'+article.id
        },
  function(err, json){
    //console.log(err, 'email overdue sent')
    //email error goes here
  });
};

/*
 * upload csv
 */
exports.uploadcsv = function(req, res, next){

    utils.getcsv(req.files, req.body, function(err, data){

      var csvConverter=new Converter({});

      if (data.slice(1,15)==='Invoiced Tasks'){//Freshbooks catch for 2nd line
        data=data.slice(43)
      }

      csvConverter.fromString(data, function(err, json,b){
          if (err) return next(err);

          //Check to makes sure csv to parsed.  Bink out if not.
          if (!json || json.length===0){
            return res.send({
                   data:[]
                  ,status: 'parse_error'
                });            
          }

          var keys = Object.keys(json[0]) //these are the keys for the particular csv you uploaded
              ,parser = csvParse.parseRules(keys); //This will get us a parser for that unique keys.  This accesses a library of parse rules.

            
          if (parser.mapper){
            convertedJson =  json.map(function(val){
              return parser.mapper(val);
            });  
          } else {
            convertedJson = json
          }    
         
          if (parser.mapper){ //This check to see if we have keys and can parse the CSV into the article model.
            var data = {
                type:'csv_upload'
              , user:req.user.id
              , csvParser:parser.keyString
              , session:req.sessionID?req.sessionID:null
              }
            utils.keenAnalytics('user_event', data);///Send data to the analytics engine
            req.article.items=req.article.items.concat(convertedJson)//We have the parsed and mapped data now to add it to the model!
            
            ///calculate the new total  this might be abstracted into a
            req.article.total=utils.calculateTotal(req.article);

            req.article.save(function(err){
              if (err) return next(err);     
              return res.send({
                   data:json
                  ,status: 'csv_parsed'
                });
            });
          } else { //We have no data we just sned back the csv json.
            
            var data = {
                type:'csv_upload'
              , user:req.user.id
              , csvParser:parser.keyString
              , session:req.sessionID?req.sessionID:null
              }
            utils.keenAnalytics('user_event', data);///Send data to the analytics engine
            return res.send({
                 data:json
                ,status: 'raw_data'
              });

          }
      });
    });
  }

/*
 * upload Image
 */
exports.uploadImage = function(req, res){
  var article = req.article;
  var files = req.files.files;

  console.log(req.files)

  if (!files || files.length===0){ return res.send([])};  
  article.uploadAndSave(files, req.user.id, function(err) {
      if (!err) {
       return res.send(article.images)
       // return res.redirect('/articles/' + article._id)
      }
    });
}

/*
 * upload csv
 */
exports.returnJSON = function(req, res, next){

}

/*
 * upload csv
 */
exports.tableJSONView = function(req, res, next){
  
    res.render('table_view', {
      title: 'Table - Ching',
      csvdata: req.body.csvdata//JSON.parse(req.body.csvdata)
    })

}



var parseTimeQuantity = function(val){
  if (isNaN(Number(val)) && typeof val === 'string' && val.search(':')!==-1)
    {var vals = val.split(':'),
         hour = vals[1]?Number(vals[0]):0,
         min = vals[1]?Number(vals[1]):0,
         sec = vals[2]?Number(vals[2]):0,
         number = hour+(min/60)+(sec/3600);
      return number;} 
  else {return 0;}
  
}








/**
 * Load
 */

exports.load = function(req, res, next, id){
  var User = mongoose.model('User')
  Article.load(id, function (err, article) {

  Org.find
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
  var perPage = 12,
      userID=req.user?req.user._id:null;
  var options = {
    perPage: perPage,
    page: page,
  }
  options.criteria={
    'viewers':{$elemMatch: {user:userID}} 
  }

  utils.keenAnalytics('user_event', {type:'index_inbox', user:req.user.id, session:req.sessionID?req.sessionID:null});

  var bodyClass = "list received";

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count(options.criteria).exec(function (err, countT) {
      res.render('articles/index', {
        invoiceType: 'received',
        title: 'Received Invoices',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(countT / perPage),
        count: countT,
        bodyClass: bodyClass,
        received:req.countReceived,
        sent:countT,
        totalCount:0
      })
    })
  })
}


/**
 * Home page
 */

exports.homeOrSent = function(req, res){
  var bodyClass = "landing";

  if (req.isAuthenticated()){
    return indexSent(req, res)
  }else{
    res.render('articles/home', {
      title: 'Ching - Zero Effort Invoicing',
      bodyClass: bodyClass
    })
  }

}


/**
 * List
 */

var indexSent = exports.indexSent = function(req, res){


  var bodyClass = "list";


  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 12,
      userID=req.user?req.user._id:null,
      time = new Date();
      time.setDate(time.getDate()-30);// set the date 30 days in the past 
  var options = {
    perPage: perPage,
    page: page,
    firstDate: time
  }

  //here we need logic to properly parse out a search API.
  //http://localhost:4000/?stuff=testtest
  //console.log(req.param('recipient'))
  //

  var includes=[];
  req.user.organizations.forEach(function(val, i){
    includes.push(val.org)
  });
  // Org.find({_id:{$in:includes}},function(err, orgs){


  // })
  //console.log(includes, req.user.organizations,'orgs')

  options.criteria={
    $and:[
      {$or:[
        {user: userID},
        {'organization':{$in: includes}}
      ]}
    ]


    
    //number:7 //search for a number
    //viewers: {$elemMatch:[{user:'541479be4b4b3f00000603db'}]}  //find a viewer
    //invoicedOn: null //find drafts
    //paidOn: null //find unpaid
    //dueOn: {$lt :new Date()}  //find overdue

    //$or:[{dueOn: {$gt :new Date()} }, {dueOn: null}]
    //paymentVerified: true //find veridfied payment
  }
  // invoicedOn:{type : Date, default : null},
  // paidOn:{type : Date, default : null},
  // paymentVerified : { type: Boolean, default: false },
  // dueOn:{type : Date, default : null},


//this is the abandoned logic to show the total amounts of paid overdue etc.
// Article.aggregate([
// //  { $match: { status: "A" } },
//   { $group: { _id: "$user", total: { $sum: "$total" } } },
//   ],function(err, results){

//     console.log(err,results)

//   res.send(results)
// });

  //Article.all(options, function(err, results){

   //  var param  =  req.param('recipient')
   // // if (param){
   //    var articles = results.filter(function(val){
   //      console.log(val.viewers[0].firstname, val.viewers[0].firstname.search(new RegExp(param,'i')))
   //      if(val.user.firstname.search(new RegExp(param,'i'))!==-1){
   //        return true
   //      } else if(val.user.lastname.search(new RegExp(param,'i'))!==-1){
   //        return true
   //      } else{
   //        return false
   //      }
        
   //    })
   // // }
   //  console.log(articles.length)


    // var count = results.length
    // , firstpage = page*perPage
    // , lastpage = (page+1)*perPage
    // //, articles = results.slice(firstpage,lastpage)
    // , total = results.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal}) 

    //placeholder for when we need this
    // an example using an object instead of an array
    // 
    var createOr=function(){
      if (!options.criteria.$or)options.criteria.$or=[];
    }
    var q = req.param('all')
        , qRegex;

    utils.keenAnalytics('user_event', {type:'index_sent', user:req.user.id, session:req.sessionID?req.sessionID:null, queary:q?q:null});

    ///(?=.*u)|(?=.*i)|(?=.*i).*/i

    if (q===""){return res.redirect('/')};///

    if (q){
          var words = q.split(' '),
              regexPart='',
              regex;


          for (var i = words.length - 1; i >= 0; i--) {


            regexPart+='(?=.*'+words[i]+')';
            regexPart+=(i===0)?'':'|';

          };
          

          regex=new RegExp(regexPart+'.*','i') 
          qRegex=regex;

          //console.log(regexPart,regex,'regex','dd'.search(regex))

    }




    async.waterfall([
        function(callback){
          var asyncResult={};
            if (!q){
               callback(null, asyncResult)
            }
            else
            User.find({$or:[{firstname:qRegex},{lastname:qRegex}, {organization:qRegex}]}).exec(function(err, users){
             // console.log(err, users)

              var uID=users.map(function(val){ return val.id})
            
              var viewerQueary = {viewers:{$elemMatch:{user: {$in:uID} } }};
              //console.log(err, users)
              //hacky parmeter stuff
              
              if (users[0] && q && q.length>0){
                createOr();
                options.criteria.$or.push(viewerQueary);//'54147c9f4d28350000cb8e50'}}
              }
              //console.log(options.criteria)
              asyncResult.users=users
              callback(null, asyncResult);
            })//user search

        },
        function(asyncResult, callback){//List
          if (!q){
               callback(null, asyncResult)
          }else
          Org.find({name:qRegex},function(err, results){
            //console.log(results, "org")

            var orgId = results.map(function(val, i){ return val.id})

            var orgQueary = {organization:{$in:orgId}};
            //console.log(orgQueary, "orgQueary")

            createOr();
            options.criteria.$or.push(orgQueary);
            asyncResult.org=results;
            callback(null, asyncResult);
          });
        },
        function(asyncResult, callback){//List

          //console.log(!isNaN(Number(q)))
          if (qRegex){
            createOr();
            options.criteria.$or.push({description:qRegex})
            options.criteria.$or.push({tags:qRegex})
            options.criteria.$or.push({title:qRegex})
          }
          var num = Number(q);
          if (!isNaN(num) && q.length>0){
            createOr();
            options.criteria.$or.push({number:num})
            options.criteria.$or.push({total:num})
          }

          //console.log(options.criteria)
          // if (asyncResult.users && asyncResult.users.length===0){
          //    asyncResult.list=[];
          //    callback(null, asyncResult)
          // }
          //else
          //console.log(options.criteria)
          Article.list(options, function(err, articles) {
            //console.log(err)
            
            asyncResult.list=articles;
            callback(null, asyncResult);

          }); 
        },
        function(asyncResult, callback){ //count

          if (!asyncResult.list || asyncResult.list.length==0){
            asyncResult.count=0;
            callback(null, asyncResult)
          }
          else
          Article.count(options.criteria).exec(function(err, count){

                asyncResult.count=count;
                callback(null, asyncResult);
          });
        },
        function(asyncResult, callback){

           if (!asyncResult.count || asyncResult.count==0){
            asyncResult.total=0;
            callback(null, asyncResult)
          }
          else
          Article.total(options, function (err, total) {
              asyncResult.total=total;
              callback(null, asyncResult);
          })//total
        }
    ],
    function(err, results) {
        // results is now equal to: {one: 1, two: 2}

   



          // console.log(count)

       //   if (err) return res.render('500')
            //console.log(err, req.total, count)
            res.render('articles/index', {
              bodyClass: bodyClass,
              invoiceType: 'sent',
              title: 'My Invoices',
              articles: results.list,
              page: page + 1,
              pages: Math.ceil(results.count / perPage),
              received:req.countReceived,
              count:results.count,
              totalCount:results.total,
              query:q
            })


        
     


    });
    ///

    




}

/**
 * New article
 */

exports.new = function(req, res){

  utils.keenAnalytics('user_event', {
      type:'new_invoice'
    , user:req.user.id
    , session:req.sessionID?req.sessionID:null
  });
  Article.highestNumber(req.user.id, function(err, number){

    var article = new Article({user:req.user.id,organization:req.user.defaultOrg, number:number});
    req.article = article;

    req.article.items.push({});//Add Tow of each type to get the started
    req.article.items.push({});
    req.article.items.push({type:'Item'});
    req.article.items.push({type:'Item'});
    
    article.save(function(err){
        if (err) {
          req.flash('error', 'No email')
          return res.redirect('/articles/'+article._id)
        }
        return res.redirect('/articles/' + article._id)
    })

  });

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

// exports.create = function (req, res) {
//   var bodyClass = "show new";
//   var article = new Article(req.body)
//   article.user = req.user

//   Article.highestNumber(req.user.id, function(err, highest){
//     console.log(highest)
//   });


//   // article.save(function (err) {
//   //   console.log(err)
//   //   if (!err) {
//   //     req.flash('success', 'Successfully created article!')
//   //     return res.redirect('/articles/'+article._id)
//   //   }

//   //   // res.render('articles/new', {
//   //   //   title: 'New Article',
//   //   //   article: article,
//   //   //   bodyClass: bodyClass,
//   //   //   error: utils.errors(err.errors || err)
//   //   // })
//   // })
// }

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
 * Pay Invoice
 */
exports.payed = function(req, res){
  var article = req.article,
      subject,
      type;

  utils.keenAnalytics('user_event', {type:'invoice_payed', user:req.user.id, sender:req.article.user.id, session:req.sessionID?req.sessionID:null});

  if (req.article.user.id==req.user.id){
    article.paymentVerifiedOn=new Date();
    type = "verified"
  } else{
    type= "payed"
  }
  
  article.views.push({
    type: type,
    user: req.user
  });

  if (req.body.body){
    article.addComment(req.user, req.body, function (err) {
      //hacky logic to account for tokens
      if (err) return res.render('500')
    })  
  }

  article.paidOn=new Date();
  var views={
            user_full_name: article.user.firstname +' '+ article.user.lastname
          , organization_article: article.user.organization?' of ':''
          , organization: article.user.organization
          , invoice_num: utils.formatInvoiceNumber(article.number)
          , action_href: domain+'/articles/'+article.id
          , notes : req.body.body?'Note Added: \"'+req.body.body+'\"':''
        },
        tmpl;
        if (article.paymentVerifiedOn){
          tmpl = emailTmplPaidVerified;
          subject = 'Invoice '+utils.formatInvoiceNumber(article.number)+' payment has been verified.'
        }else{
          tmpl = emailTmplPaid;
          subject = 'Invoice '+utils.formatInvoiceNumber(article.number)+' has been marked as payed!'
        }
  sendEmail({to: article.user.email
          , fromname : article.user.firstname +' '+article.user.lastname
          , from: 'noreply@ching.io'
          , subject: subject
          , html : Mustache.render(tmpl, views)
          , message: subject
        },
  function(err, json){
    if (err){console.log('Email Error')};
    article.save(function(err) {
      if (err) {
        res.flash('error','Something Went Wrong')
      }

      var redirect;
      req.flash('success', 'You have marked this invoice as payed.')

      if (req.token){
       redirect = '/articles/'+ article.id+'/token/'+req.token;
      } else{
        redirect = '/articles/' + article._id;
      }
      res.redirect(redirect)

    })
  });
}

/**
 * UnPay Invoice
 */
exports.unpayed = function(req, res){
  var article = req.article

  utils.keenAnalytics('user_event', {type:'invoice_unpayed', user:req.user.id, sender:req.article.user.id, session:req.sessionID?req.sessionID:null});

  article.paymentVerifiedOn=null;
  article.paidOn=null;

  article.save(function(err) {
    if (err) {
      res.flash('error','Something Went Wrong')
    }
    res.redirect('/articles/' + article._id)
  })
}

/**
 * Update article
 */

exports.update = function(req, res){
  var article = req.article

  utils.keenAnalytics('user_event', {type:'invoice_edit_update', user:req.user.id, session:req.sessionID?req.sessionID:null});

  if (req.body.organization===""){ //If the user is updating the organization unset it.
    article.organization=undefined;
  }else{ //otherwise we can just update the article.  We do this because they are seperate on the front end.
    article = extend(article, req.body)
  };

  article.save(function(err) {
    if (err) {
      req.flash('error', "Opps,  We could not save your changes.");
    }
    return res.redirect('/articles/' + article._id)
  })
}



/**
 * Show
 */

exports.show = function(req, res, next){

  utils.keenAnalytics('user_event', {type:'invoice_show', user:req.user.id, session:req.sessionID?req.sessionID:null});

  var bodyClass = "show";

  function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1);
  }
  if (req.article.title) {
    var title = capitalize(req.article.status) + " - " + req.article.title
  }
  else {
    var title = capitalize(req.article.status) + " - Invoice";
  }

  if (req.article.user.id===req.user.id){
    var invoiceType='sent'
  } else {
    var invoiceType='recieved'
  }
  var includes=[];
  if (req.user.organizations){
    req.user.organizations.forEach(function(val, i){
      includes.push(val.org)
    });    
  }
  Org.find({_id:{$in:includes}},function(err, orgs){
    res.render('articles/show', {
      title: title,
      invoiceType:invoiceType,
      article: req.article,
      organizations: orgs,
      bodyClass: bodyClass,
      keenConfigObj:utils.keenConfigObj,
      preview: 'yad'
    });
  });//Org find
}



var isViewer=function(id, viewers){

  viewers.forEach(function(val){

    console.log()
  });

//article.user.id===user.id

} 
/**
* Record View
*/
exports.record = function(req, res, next){
  var article = req.article
    , viewer  = req.user
    , user = req.user
    , userId = viewer.user && viewer.user.id? viewer.user._id:user.id;

    if (user && !authorization.isViewerCheck(article.viewers, user.id)){ //we are bonking out if the user or group member is viewing
      return next();
    } else{
      if (!article.views || article.views.length===0){
        sendFirstViewerEmail(article, viewer);
      }
      article.addPageView({user:userId, type:'viewed'}, function (err, obj, newViewer) {
        if (err) return res.render('500')
        next()
      });

    }
}

sendFirstViewerEmail=function(article, viewer){ 
    var name = viewer.firstname +' '+ viewer.lastname
      , views={
            user_full_name: name
          , invoice_num: utils.formatInvoiceNumber(article.number)
          , action_href: domain+'/articles/'+article.id
        };

  sendEmail({to: article.user.email
          , fromname : 'Ching'
          , from: 'noreply@ching.io'
          , subject: name+' Viewed Invoice #'+utils.formatInvoiceNumber(article.number)
          , html : Mustache.render(invoiceFirstViewed, views)
          , message: views.user_full_name+' has viewed invoice '+ views.invoice_num+'. Click this link to visit the invoice: '+domain+'/articles/'+article.id
        },function(err, json){
          if (err){console.log('Email Error')};

          console.log('Email first sent')
        });
};

/**
 * Delete an article
 */

exports.destroy = function(req, res){
  var article = req.article
  article.remove(function(err){
    req.flash('info', 'Deleted successfully')
    res.redirect('/')
  })
}

// exports.verifiedAsPayed = function(req, res){
//   var article = req.article
//   article.update(function(err){
//     // req.flash('info', 'Deleted successfully')
//     // res.redirect('/articles')
//   })
// }

exports.graph=function(req, res){
    var userID=req.user?req.user._id:null
      , options={};

      //hard coded data
    var data = [{"date":"11-Oct-14","IE":"41.95","Firefox":"25.78","Safari":"8.79","Opera":"1.25"}
    ,{"date":"11-Oct-15","IE":"37.64","Firefox":"25.96","Safari":"10.16","Opera":"1.39"}
    ,{"date":"11-Oct-16","IE":"37.27","Firefox":"25.98","Safari":"10.59","Opera":"1.44"}
    ,{"date":"11-Oct-17","IE":"42.74","Firefox":"25.01","Safari":"0","Opera":"0"}];

  options.criteria={
    user: userID,
    //createdOn: {$gt :new Date()}, //This will limit the qeary to non paid
    //paidOn: null //This will limit the qeary to non paid
    
    //$or:[{createdOn: {$gt :new Date()}}, {paidOn: null}]  //This will limit the qeary to non paid


    //number:7 //search for a number
    //viewers: {$elemMatch:[{user:'541479be4b4b3f00000603db'}]}  //find a viewer
    //invoicedOn: null //find drafts
    //paidOn: null //find unpaid
    //dueOn: {$lt :new Date()}  //find overdue

    //$or:[{dueOn: {$gt :new Date()} }, {dueOn: null}]
    //paymentVerified: true //find veridfied payment
  }

    Article.graph(options, function(err, result){

      //console.log(result)

      //Currently limited queary to toal's and date.  We can use:
      var grouped = _.groupBy(result, function(val, i){
        var date = utils.formateDate(val.createdAt);
        return date;
      });

      var groupedSortedKeys = _.keys(grouped);
    
      groupedSortedKeys = _.sortBy(groupedSortedKeys,function(val, i){
        return new Date(val);
      });

      var objTotal={paid:0, sent:0},
          graphObj = [];
      _.each(groupedSortedKeys, function(key){
       
        var val = grouped[key];
        _.each(val, function(val, i){
          if (val.paidOn){
            objTotal.paid+=val.total;
          } else if (val.invoicedOn){
            objTotal.sent+=val.total;
          }
        });

        returnObj = _.clone(objTotal); 
        returnObj.date=key;
        graphObj.push(returnObj);
      })

      // var groupedSorted = _.sortBy(grouped,function(val, i){
      //   return new Date(i);
      // })


      // var objTotal={paid:0, sent:0};
      // var graphObj = _.map(groupedSorted,function(valDate, i){
      

      // console.log(i, groupedSortedKeys)

      //   _.each(valDate, function(val, i){

      //     if (val.paidOn){
      //       objTotal.paid+=val.total;
      //     } else if (val.invoicedOn){
      //       objTotal.sent+=val.total;
      //     }

      //   });

      //   returnObj = _.clone(objTotal); 
      //   returnObj.date=groupedSortedKeys[i];
      //   return returnObj
      // });


      //console.log(graphObj)
      res.send(graphObj)



        

      });

      //ie _.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); }); to group by dates
      //console.log(err, result)




}


exports.pdf = function(req, res){
    var data={
        is_owner:req.article.user.id==req.user.id
      , article_owner:req.article.user.id
      , type:'download_pdf'
      , user:req.user.id
      , session:req.sessionID?req.sessionID:null
    }
    utils.keenAnalytics('user_event', data);
    utils.pdf(req, itemsSchema, function(err, doc){

      // Write headers 
      var filename = req.article.user.firstname +'_'+ req.article.user.lastname
      if (req.article.user.organization!==null){filename+=req.article.user.organization}
      res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'attachment; filename=#'+utils.formatInvoiceNumber(req.article.number)+'.pdf',
      });

      // Pipe generated PDF into response
      doc.pipe(res);
      doc.end();

    })



}