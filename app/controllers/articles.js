/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , utils = require('../../lib/utils')
  , validateEmail = utils.validateEmail
  , extend = require('util')._extend
  , fs    = require('fs')
  , Converter=require("csvtojson").core.Converter
  , _ = require("underscore");



/**
 * upload
 */
exports.uploadcsv = function(req, res){

    getcsv(req.files, req.body, function(err, data){

      var csvConverter=new Converter({});
      csvConverter.fromString(data, function(err, json){
          if (err) return next(err);


          var convertedJson = converterJSON(json);

           



          if (true){



            req.article.items=req.article.items.concat(convertedJson)

            
            req.article.save(function(err){
              if (err) return next(err);     
              return res.send({
                   data:json
                  ,status: 'Ching Uploaded!'
                });
            });
          } else {

            return res.send({
                 data:json
                ,status: 'raw data'
              });

          }
      });
    });
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

  var serviceList = {  
         dingKey : [ 'Date', 'Time', 'Project', 'User', 'Comment' ]
         ,expensifyKey : [ 'Timestamp', 'Merchant', 'Amount', 'MCC', 'Category', 'Tag', 'Comment', 'Reimbursable', 'Original Currency', 'Original Amount', 'Receipt' ]
        ,freshbooksTime : ["Task name","Client name","Invoice","Invoice Date","Rate","Hours","Discount","Line Cost","Currency" ]
        ,freshbooksExpense : ["Date","Category","Vendor","Client","Author","Project","Notes","Amount","Bank Name","Bank Account"]
         ,paymo : ["Project","Task List","Task","User","Start Time","End Time","Notes","Hours"]
         ,shoebox : ["Date","Store","Note","Total (USD)", "Tax (USD)","Payment Type","Category","Receipt"]
         ,harvest : ["Date","Client","Project","Project Code","Task","Notes","Hours","Billable?","Invoiced?","First Name","Last Name","Department","Employee?","Hourly Rate","Billable Amount","Currency"]
         ,toggl : ["User","Email","Client","Project","Task","Description","Billable","Start date","Start time","End date","End time","Duration","Tags","Amount ()"]
        // ,timeeye : ["projectId","projectName","billableMinutes","billableExpenses","totalMinutes","totalExpenses"]
        // ,timeeye : ["entryDate","userId","userName","projectId","projectName","taskId","taskName","notes","billed","minutes","expenses"]
        // ,timeeye : ["projectId","projectName","fixedAmount","hourlyRate","billableMinutes","billableTimeAmount","billableExpenses","totalMinutes","totalExpenses"]
        ,freckle : ["Date","Person","Group/Client","Project","Minutes","Hours","Tags","Description","Billable","Invoiced","Invoice Reference","Paid"]
        ,bigtime : ["Job","Staff Member","Category","Date","Input","N/C","Notes"]
        ,tsheets : ["username","payroll_id","fname","lname","number","group","local_date","local_day","local_start_time","local_end_time","tz","hours","jobcode","location","notes","approved_status"]
        ,tsheets_2 : ["username","payroll_id","fname","lname","number","group","local_date","local_day","local_start_time","local_end_time","tz","hours","jobcode","location","notes"]

      },
      serviceListKeys=_.keys(serviceList);



      parseRules = function(keys){
        var rule
          , tsheet = function(val){
              return {
                    date: val.local_date?new Date(val.local_date.split('-')):null
                  , qty : val.hours?Number(val.hours):null
                  , item : (val.username?val.username:'')+' - '+(val.lname?val.lname:'')+', '+(val.fname?val.fname:'')
                  , type : 'Time'
              }
            };

        console.log(keys)

        var key = null;
        serviceListKeys.some(function(val, i){
          var test = _.isEqual(serviceList[val], keys);
                  console.log(test, val)

          key = test?val:null;
          return test
        });
        console.log(key)

        switch (key) {
          case "dingKey":
            rule=tsheet
            break;
          case "tsheets":
            rule=tsheet
            break;
          case "tsheets_2":
            return tsheet;
            break;
          case "bigtime":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Input?Number(val.Input):null
                  , item : val['Staff Member']?val['Staff Member']:null
                  , type : 'Time'
                  , note : (val.Job?val.Job:'')+' - '+(val.Category?val.Category:'')
              }
            }
            break;
          case "expensifyKey":
            rule=function(val){
              return {
                    date: val.Timestamp?new Date(val.Timestamp.split('-')):null
                  , cost : val.Amount && !isNaN(Number(val.Amount))?Number(val.Amount):null
                  , qty : 1
                  , item : val.Merchant?val.Merchant:''
                  , type : 'Item'
                  , note : (val.Comment?val.Comment:'')+' - '+(val['']?val.Tag:'')+' - '+(val['Original Currency']?val['Original Currency']:'')
              }
            }
            break;
          case "shoebox":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , cost : val['Total (USD)'] && !isNaN(Number(val['Total (USD)']))?Number(val['Total (USD)']):null
                  , qty : 1
                  , tax1: val['Tax (USD)'] && !isNaN(Number(val['Tax (USD)']))?Number(val['Tax (USD)']):null
                  , item : val.Store?val.Store:''
                  , type : 'Item'
                  , note : (val.Note?val.Note:'')+' - '+(val['Payment Type']?val['Payment Type']:'')+' - '+(val.Category?val.Category:'')
              }
            }
            break;
          case "paymo":
            rule=function(val){
              return {
                    date: ( val['Start Time'] && val['Start Time'].slice(0,10) )?new Date(val['Start Time'].slice(0,10).split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : val.User?val.User:''
                  , type : 'Time'
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Project?val.Project:'')+' - '+(val['Task List']?val['Task List']:'')+' - '+(val.Task?val.Task:'')
              }
            }
            break;
          case "freckle":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Hours?val.Hours:null
                  , item : val.Person?val.Person:''
                  , type : 'Time'
                  , note : (val.Description?val.Description:'')+' - '+(val.Project?val.Project:'')+' - '+(val['Group/Client']?val['Group/Client']:'')+' - '+(val.Tags?val.Tags:'')
              }
            }
            break;
          case "freshbooksExpense":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : 1
                  , cost : val.Amount?val.Amount:null
                  , item : val.Category?val.Category:''
                  , type : 'Item'
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Vendor?val.Vendor:'')+' - '+(val.Project?val.Project:'')
              }
            }
            break;
          case "toggl":
            rule=function(val){
              return {
                    date: val['Start date']?new Date(val['Start date'].split('-')):null
                  , qty : val.Duration?parseTimeQuantity(val.Duration):null
                  , item : val.User?val.User:null
                  , type : 'Time'
                  , note : (val.Description?val.Description:'')+' - '+(val.Client?val.Client:'')+' - '+(val.Project?val.Project:'')
              }
            }
            break;
          case "harvest":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : (val['Last Name']?val['Last Name']:null)+', '+(val['First Name']?val['First Name']:null)
                  , type : 'Time'
                  , cost: val['Hourly Rate']?val['Hourly Rate']:null
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Job?val.Job:'')+' - '+(val.Category?val.Category:'')+' - '+(val.Project?val.Project:'')+' - '+(val.Currency?val.Currency:'')
              }
            }
            break;
        }

      // [ 'Timestamp', 'Merchant', 'Amount', 'MCC', 'Category', 'Tag', 'Comment', 'Reimbursable', 'Original Currency', 'Original Amount', 'Receipt' ]

        console.log(rule)
        return rule;
      };

converterJSON = function(json){


          var keys = Object.keys(json[0])
            , matchVal;

          // var dingKey = [ 'Date', 'Time', 'Project', 'User', 'Comment' ];
          // var expensifyKey =[ 'Timestamp', 'Merchant', 'Amount', 'MCC', 'Category', 'Tag', 'Comment', 'Reimbursable', 'Original Currency', 'Original Amount', 'Receipt' ];
          // var freshbooksTime =["Task name","Client name","Invoice","Invoice Date","Rate","Hours","Discount","Line Cost","Currency" ];
          // var freshbooksExpense =["Date","Category","Vendor","Client","Author","Project","Notes","Amount","Bank Name","Bank Account"]
          // var paymo = ["Project","Task List","Task","User","Start Time","End Time","Notes","Hours"]
          // var shoebox = ["Date","Store","Note","Total (USD)", "Tax", "(USD)","Payment Type","Category","Receipt"]
          // var harvest = ["Date","Client","Project","Project Code","Task","Notes","Hours","Billable?","Invoiced?","First Name","Last Name","Department","Employee?","Hourly Rate","Billable Amount","Currency"]
          // var toggl = ["Client","Project","Registered time","","Amount ()"]
          // var timeeye = ["projectId","projectName","billableMinutes","billableExpenses","totalMinutes","totalExpenses"]
          // var timeeye = ["entryDate","userId","userName","projectId","projectName","taskId","taskName","notes","billed","minutes","expenses"]
          // var timeeye = ["projectId","projectName","fixedAmount","hourlyRate","billableMinutes","billableTimeAmount","billableExpenses","totalMinutes","totalExpenses"]
          // var freckle = ["Date","Person","Group/Client","Project","Minutes","Hours","Tags","Description","Billable","Invoiced","Invoice", "Reference","Paid"]
          // var tsheets = ["username","payroll_id","fname","lname","number","group","local_date","local_day","local_start_time","local_end_time","tz","hours","jobcode","location","notes","approved_status"]


          // var match = serviceListKeys.some(function(val){
          //   // console.log(
          //   //   serviceList[val]
          //   //   , keys
          //   //   , _.isEqual(serviceList[val], keys)
          //   //   , 'matcher')
          //   matchVal = val;
          //   return _.isEqual(serviceList[val], keys);
          // });

          //console.log(match, matchVal);


          //now we need to map the vlaues to our values
          //var m = parseRules(matchVal);

          //console.log(m);

          var mapper = parseRules(keys);
          return json.map(function(val){
                    return mapper(val);
                 });
            

          // var convertedJson = json.map(function(val, i){
          //   return {
          //      date: new Date(val.Date.split('-'))
          //     , qty : parseTimeQuantity(val.Time)
          //     , item : val.User+' - '+val.Project
          //     , note : val.Comment
          //   }
          // });

          // return convertedJson;



}
    //console.log(req.body.csv)
    // if (!req.files){

    //       csvConverter.fromString(req.body.csv,function(err, jsonObj){

    //           return res.send({
    //                    data:jsonObj
    //                   ,status: 'raw data'
    //                 });

    //       });

    // }else{
  
    //   fs.readFile(req.files.files[0].path, {encoding: 'utf-8'}, function(err,data){
    //     var csvConverter=new Converter({});
    //         csvConverter.fromString(data,function(err, jsonObj){
    //           return res.send({
    //              data:jsonObj
    //             ,status: 'raw data'
    //           });
    //         });//CSV convert
    //         fs.unlinkSync(req.files.files[0].path);
    //   });//file read

    // }






var getcsv=function(files, body, cb){
   if (!files && body.csv){
      cb(null, body.csv);
   } else if (files && files.files[0]) {
      fs.readFile(files.files[0].path, {encoding: 'utf-8'}, function(err,data){
        cb(null,data);
        fs.unlinkSync(files.files[0].path);
      });//file read
   }else{
    cb('no csv', null);
   }

}


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
        title: 'Received Invoices',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage)
      })
    })
  })
}


/**
 * Home page
 */

exports.homeOrSent = function(req, res){

  if (req.isAuthenticated()){
    return indexSent(req, res)
  }else{
    res.render('articles/home', {
      title: 'Home',
    })
  }

}


/**
 * List
 */

var indexSent = exports.indexSent = function(req, res){
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


  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count().exec(function (err, count) {
      res.render('articles/index', {
        title: 'Sent Invoices',
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
  var article = new Article({user:req.user.id});
  req.article = article;
  article.save(function(){
      return res.redirect('/articles/' + article._id)
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
