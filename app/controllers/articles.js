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
  , _ = require("underscore")
  , pdfDocument = require( "pdfkit")
  , itemsSchema = require('../models/article').itemsSchema;

/**
 * upload
 */
exports.uploadcsv = function(req, res, next){

    getcsv(req.files, req.body, function(err, data){

      var csvConverter=new Converter({});

      if (data.slice(1,15)==='Invoiced Tasks'){//Freshbooks catch for 2nd line
        data=data.slice(43)
      }

      csvConverter.fromString(data, function(err, json){
          if (err) return next(err);

          //we need logic to figure out when something gets parsed correctly.
          var keys = Object.keys(json[0])
              , mapper = parseRules(keys);

            
          if (mapper){
            convertedJson =  json.map(function(val){
              return mapper(val);
            });  
          } else {
            convertedJson = json
          }    


          console.log(mapper)
          if (mapper){

            req.article.items=req.article.items.concat(convertedJson)

            
            req.article.save(function(err){
              if (err) return next(err);     
              return res.send({
                   data:json
                  ,status: 'StuffU ploaded!'
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

        //Find the Keys
        var key = null;
        serviceListKeys.some(function(val, i){//This logic only finds the matching keys var
          var test = _.isEqual(serviceList[val], keys);
          key = test?val:null;
          return test
        });
        //This contains the facotrs whuch parse the json returned from CSV.
        switch (key) {
          case "dingKey":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Time?parseTimeQuantity(val.Time):null
                  , item : val.User?val.User:''+' - '+val.Project?val.Project:''
                  , note : val.Comment?val.Comment:null
                  , type : 'Time'
              }
            }
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
                  , total : (val.Amount)? val.Amount:null
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
                  , total : (val['Total (USD)'])? val['Total (USD)']:null

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
                  , cost : val.Amount?Number(val.Amount.replace(',','')):null
                  , item : val.Category?val.Category:''
                  , type : 'Item'
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Vendor?val.Vendor:'')+' - '+(val.Project?val.Project:'')
                  , total : (val.Amount)? val.Amount:null
              }
            }
            break;
          case "freshbooksTime":
            rule=function(val){
              return {
                    date: val['Invoice Date']?new Date(val['Invoice Date'].split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : val['Task name']?val['Task name']:''
                  , type : 'Time'
                  , cost: val.Rate?Number(val.Rate.replace(',','')):null
                  , note : (val['Client name']?val['Client name']:'')
                  , total : (val.Hours && val.Rate)?Number(val.Hours)*Number(val.Rate.replace(',','')):null
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
                  , cost: val['Hourly Rate']? Number( val['Hourly Rate'].replace(',','') ):null
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Job?val.Job:'')+' - '+(val.Category?val.Category:'')+' - '+(val.Project?val.Project:'')
                  , total : (val.Hours && val['Hourly Rate'])?Number(val.Hours)*val['Hourly Rate']:null
              }
            }
            break;
        }
        return rule;//We returnt he rule for building the JSON
      };


var getcsv=function(files, body, cb){
   if (!files && body.csv){
      cb(null, body.csv);
   } else if (files && files.files[0]) {
      fs.readFile(files.files[0].path, {encoding: 'utf-8'}, function(err,data){
        fs.unlinkSync(files.files[0].path);
        cb(null,data);
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


var formateDate = function(d){
  var string = '';
  string=d.getDate()+'/' // Returns the date
  string+=d.getMonth()+'/' // Returns the month
  string+=d.getFullYear() // Returns the year
  return string;
}

exports.pdf = function(req, res){

    console.log(req.article.title)
    //return res.send('!ha');




    // // Create PDF
    var doc = new pdfDocument();

    var m=doc.font('Times-Roman', 13)
    
    // m.text('jeff')
    // m.addPage();
    // m.text('jeff')


    

    var drawRows = function(rows, margin){

        var rowHeight = 55;

        _.keys(itemsSchema).forEach(function(key){
            var colIndex = itemsSchema[key].columnPosition,
                rowWidth =55;//itemsSchema[key].printColWidth
            m.text(key?String(key):'', margin.left+rowWidth*colIndex, margin.top );
        });

        rows.forEach(function(rowObj, rowIndex){
            var rowWidthIndex = 0;
              _.keys(itemsSchema).forEach(function(key){
                  var colIndex = itemsSchema[key].columnPosition,
                      rowWidth =55,//itemsSchema[key].printColWidth,
                      content;
                    // var filtered= _.values(itemsSchema).filter(function(val){return val.columnPosition<colIndex}).map(function(val){ return val.printColWidth})
                    //     ,sum = filtered.length?filtered.reduce(function(a,b){ return a+b}):0;

                    //                     console.log(sum)


                  if (key==='date'){
                    content = rowObj[key]?formateDate(rowObj[key]):'';
                  }else{
                    content = rowObj[key]?String(rowObj[key]):''
                  }

                  // if (key==='note'){

                  // }
                  
                  doc.text(
                    content, 
                    margin.left+rowWidth*colIndex, 
                    (margin.top+rowHeight)+(rowHeight*rowIndex), 
                    {width: rowWidth,
                     height:55} 
                    );
                   //rowWidthIndex+=rowWidth; ///almost pull objects and sort them

              }) 

        });
         
    }

    // doc.text('Times-RomanTimes-RomanTimes-RomanTimes-RomanTimes-Roman',100,100,{width:40})
    // doc.text('Times-RomanTimes-RomanTimes-RomanTimes-RomanTimes-Roman',100,100,{width:40})


    // drawRows(req.article.items,{left:50,top:50})
    // console.log(req.article.items.length)

     req.article.items.forEach(function(val, i){

        var perPage = 12
          , margin = {left:50,top:50};

        if (i===0){
          drawRows(req.article.items.slice(i,i+perPage),margin);
        }else if ( (i % perPage)===0){
          doc.addPage();
          drawRows(req.article.items.slice(i,i+perPage), margin);
        }

     });

    // req.article.items.forEach(function(rowObj, rowIndex){

    //       _.keys(itemsSchema).forEach(function(key){
    //           var colIndex = itemsSchema[key].columnPosition;
    //           doc.text(rowObj[key]?String(rowObj[key]).slice(0,5):'', 40+40*colIndex, 60+30*rowIndex );
    //       })  

    // });

    // Write headers
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'attachment; filename='+req.article.title+'.pdf',
    });


    // Pipe generated PDF into response
    doc.pipe(res);
    doc.end();
    //doc=null;


  // // create a document and pipe to a blob
  // var doc = new PDFDocument();
  // //var stream = doc.pipe(blobStream());

  // // draw some text
  // doc.fontSize(25)
  //    .text('Here is some vector graphics...', 100, 80);
     
  // // some vector graphics
  // doc.save()
  //    .moveTo(100, 150)
  //    .lineTo(100, 250)
  //    .lineTo(200, 250)
  //    .fill("#FF3300");
     
  // doc.circle(280, 200, 50)
  //    .fill("#6600FF");
     
  // // an SVG path
  // doc.scale(0.6)
  //    .translate(470, 130)
  //    .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
  //    .fill('red', 'even-odd')
  //    .restore();
     
  // // and some justified text wrapped into columns
  // doc.text('And here is some wrapped text...', 100, 300)
  //    .font('Times-Roman', 13)
  //    .moveDown()
  //    .text(lorem, {
  //      width: 412,
  //      align: 'justify',
  //      indent: 30,
  //      columns: 2,
  //      height: 300,
  //      ellipsis: true
  //    });

  // doc.pipe(res)

     
  // // end and display the document in the iframe to the right
  // doc.end();
  // stream.on('finish', function() {
  //   iframe.src = stream.toBlobURL('application/pdf');
  // });


}