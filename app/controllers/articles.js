/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Article = mongoose.model('Article')
  , utils = require('../../lib/utils')
  , csvParse = require('../../utils/csvParse')
  , validateEmail = utils.validateEmail
  , extend = require('util')._extend
  , fs    = require('fs')
  , Converter=require("csvtojson").core.Converter
  , _ = require("underscore")
  , pdfDocument = require( "pdfkit")
  , itemsSchema = require('../models/article').itemsSchema
  , sendEmail = utils.sendEmail
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , domain = config.rootHost
  , emailTmplPaid = fs.readFileSync('./app/views/email/paid.html','utf8')
  , Mustache = require('mustache');


// var Keen = require('keen.io');

// var client = Keen.configure({
//     projectId: "546dc37b36bca44b4bfcaf3e",
//     writeKey: "8af6a1cc9a40021100e789f9010922a866fc7cafaeef7556217dd596738d779b0210ba1c45d11b5690865525fe9c05360e5aa344847617486eee4efe1a14575ecad3fce442b2c6c707c482b1c3a824914a216f64c76da2afbcde668c0095788281eb33f6c286678e43ad328eb0996717",
//     readKey: "f631dfd829dba39d1d8efa8b22b6397ba7276991180db8733dbf354d2b645ef4b916bb3e71b9f6309a6181664a5ab2fb823cfdc3a3adec14a6e30dcbcb9783054cbdb4d8b5d1e97c14fca2a0a78abd793184a018057dd9e8b997196bd619984fb2ff3faa93a37580976b86b24658c1d2",
//     masterKey: "56431B491A7ADDAA1DACA079F6165952"
// });

// var Analytics = function(collection, keyVals, cb){
//   client.addEvent(collection, keyVals, function(err, res) {
//     if (err && cb) {
//       cb(err, null)
//         console.log("Oh no, an error!", err);
//     } else if (cb) {
//       cb(null, res)
//     }
//   });
// }

/*
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
              ,parser = csvParse.parseRules(keys);

            
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
              console.log(data)
            utils.keenAnalytics('user_event', data);///Send data to the analytics engine
            req.article.items=req.article.items.concat(convertedJson)//We have the parsed and mapped data now to add it to the model!
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
              console.log(data)
            utils.keenAnalytics('user_event', data);///Send data to the analytics engine
            return res.send({
                 data:json
                ,status: 'raw_data'
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
  var perPage = 12,
      userID=req.user?req.user._id:null;
  var options = {
    perPage: perPage,
    page: page,
  }
  options.criteria={
    'viewers':{$elemMatch: {user:userID}} 
  }

  var bodyClass = "list received";

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count(options.criteria).exec(function (err, countT) {
      console.log()
      res.render('articles/index', {
        invoiceType: 'received',
        title: 'Received Invoices',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(countT / perPage),
        count: countT,
        bodyClass: bodyClass,
        received:req.countReceived,
        sent:countT
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
      title: 'Home',
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
  options.criteria={
    user: userID,
  }

//this is the abandoned logic to show the total amounts of paid overdue etc.
// Article.aggregate([
// //  { $match: { status: "A" } },
//   { $group: { _id: "$user", total: { $sum: "$total" } } },
//   ],function(err, results){

//     console.log(err,results)

//   res.send(results)
// });

  Article.list(options, function(err, articles) {
    if (err) return res.render('500')
    Article.count(options.criteria).exec(function (errC, count) {
     // console.log(errR, countReceived)
      res.render('articles/index', {
        bodyClass: bodyClass,
        invoiceType: 'sent',
        title: 'Sent Invoices',
        articles: articles,
        page: page + 1,
        pages: Math.ceil(count / perPage),
        received:req.countReceived,
        sent:count
      })
    })//Count All articles

  })
}

/**
 * New article
 */

exports.new = function(req, res){

  utils.keenAnalytics('user_event', {type:'new_invoice', user:req.user.id});
  Article.highestNumber(req.user.id, function(err, number){

    var article = new Article({user:req.user.id, number:number});
    req.article = article;

    req.article.items.push({});//Add One of each type to get the started
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
  var article = req.article

  //article = extend(article, req.body)
  article.paymentVerified=true;
  article.paidOn=new Date();
  var views={
            user_full_name: article.user.firstname +' '+ article.user.lastname
          , organization_article: article.user.organization?' of ':''
          , organization: article.user.organization
          , invoice_num: utils.formatInvoiceNumber(article.number)
          , action_href: domain+'/articles/'+article.id
        };
  sendEmail({to: article.user.email
          , fromname : article.user.firstname +' '+article.user.lastname
          , from: 'noreply@ching.io'
          , subject: 'Invoice #'+utils.formatInvoiceNumber(article.number)+' has been paid.'
          , html : Mustache.render(emailTmplPaid, views)
          , message: 'Your invoice has been payed!'
        },
  function(err, json){
    if (err){console.log('Email Error')};
    article.save(function(err) {
      if (err) {
        res.flash('error','Something Went Wrong')
      }
      var redirect = '/articles/' + article._id;
      if (req.token){redirect+='/token/'+req.token};
      res.redirect(redirect)

    })
  });
}

/**
 * UnPay Invoice
 */
exports.unpayed = function(req, res){
  var article = req.article

  article.paymentVerified=false;
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
  console.log(req.body)

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
 * Pay article
 */

exports.pay = function(req, res){
  var article = req.article

  //article = extend(article, req.body)

  article.paidOn=new Date();
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
  res.render('articles/show', {
    title: title,
    invoiceType:invoiceType,
    article: req.article,
    bodyClass: bodyClass
  })
}

/**
 * Record View
 */

exports.record = function(req, res, next){
  var article = req.article
    , viewer  = req.user
    , user = req.user
    , userId = viewer.user && viewer.user.id? viewer.user._id:user.id;

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

// exports.verifiedAsPayed = function(req, res){
//   var article = req.article
//   article.update(function(err){
//     // req.flash('info', 'Deleted successfully')
//     // res.redirect('/articles')
//   })
// }



var formateDate = function(d){
  var string = '';
  string+=(d.getMonth()+1)+'/' // Returns the month
  string+=d.getDate()+'/' // Returns the date
  string+=d.getFullYear() // Returns the year
  return string;
}

exports.pdf = function(req, res){
    // Create PDF
    // I know I need to commenbt this so here I go!
    // 
    var data={
        is_owner:req.article.user.id==req.user.id
      , article_owner:req.article.user.id
      , type:'download_pdf'
      , user:req.user.id
    }
    utils.keenAnalytics('user_event', data);

    var doc = new pdfDocument();
    var m=doc.font('Helvetica', 12)
    var drawRows = function(rows, margin,rowHeight,colPadding){
        var keys = _.keys(itemsSchema).sort(function(key,keyTwo){
              return itemsSchema[key].columnPosition>itemsSchema[keyTwo].columnPosition
            });
            //console.log(keys)

        var rowWidthIndexHeader = 0;
        keys.forEach(function(key, colIndex){

            //var colIndex = itemsSchema[key].columnPosition,
            var rowWidth =itemsSchema[key].printColWidth;
                //console.log(key,colIndex,rowWidth,rowWidthIndexHeader)

            m.fillColor('#888888').text(key?String(key):''
              , margin.left+rowWidthIndexHeader
              , margin.top 
              , {width: rowWidth,
                  height:rowHeight
                });
            rowWidthIndexHeader+=(rowWidth+colPadding);

        });

        rows.forEach(function(rowObj, rowIndex){
            var rowWidthIndex = 0;

              keys.forEach(function(key){
                  var colIndex = itemsSchema[key].columnPosition,
                      rowWidth =itemsSchema[key].printColWidth,
                      content;

                  if (key==='date'){
                    content = rowObj[key]?formateDate(rowObj[key]):'';
                  }else if(['cost','total'].indexOf(key)!==-1){
                    //content = rowObj[key]?rowObj[key].toFixed(2):'';
                    content = rowObj[key]?utils.formatCurrency(rowObj[key]):'';
                  }else if (['tax1','tax2','qty'].indexOf(key)!==-1){
                    content = rowObj[key]?rowObj[key].toFixed(2):'';
                    content = content?String(content):'';
                  }else{
                    content = rowObj[key]?String(rowObj[key]):''
                  }

                  
                  doc.fillColor('black').text(
                    content, 
                    margin.left+rowWidthIndex, 
                    (margin.top+rowHeight)+(rowHeight*rowIndex), 
                    {width: rowWidth,
                     height:rowHeight
                   });
                   rowWidthIndex+=(rowWidth+colPadding); ///almost pull objects and sort them

              }) 

        });
         
    }



     

   doc.font('Helvetica', 30).text('Invoice',{align: 'center'})
     
   doc.font('Helvetica', 15).fillColor('#787878 ').text('#'+utils.formatInvoiceNumber(req.article.number))
   doc.text('Name: '+req.article.user.firstname+" "+req.article.user.lastname)
   if (req.article.user.organization){
     doc.text('Organization: '+req.article.user.organization);
   }
   
   if (req.article.invoicedOn){   
    doc.text('Invoiced On: '+ formateDate(req.article.invoicedOn));
   }   

   
   doc.moveTo(0, 185)
      .lineTo(700, 185)
      .strokeColor('#eee')
      .lineWidth(5)
      .stroke() 

    var articles = req.article.items
      , perPage = 15
      , rowHeight = 45
      , colPadding = 5
      , margin = {left:50,top:50}
      , perPageFirst = 10
      , marginFirst = {left:50,top:200}
      , lastIndex = 0
      , nextIndex = articles.length<=perPageFirst?articles.length:perPageFirst;
    
    doc.font('Helvetica', 12).fillColor('black')
    req.article.items.forEach(function(val, i){


        if (i==lastIndex){
          //drawRows(req.article.items.slice(i,perPageFirst),marginFirst, rowHeight, colPadding);
        //}else if ( nextIndex == i ){
          if(lastIndex!==0){doc.addPage()};
          drawRows(req.article.items.slice(lastIndex,nextIndex),lastIndex!==0?margin:marginFirst, rowHeight, colPadding);
          nextIndex+=perPage;
          lastIndex=(nextIndex-perPage)
        }

    });
   doc.addPage()
   doc.font('Helvetica', 18).text('Total: '+utils.formatCurrency(req.article.total),{align: 'right'})

    // req.article.items.forEach(function(rowObj, rowIndex){

    //       _.keys(itemsSchema).forEach(function(key){
    //           var colIndex = itemsSchema[key].columnPosition;
    //           doc.text(rowObj[key]?String(rowObj[key]).slice(0,5):'', 40+40*colIndex, 60+30*rowIndex );
    //       })  

    // });

    // Write headers
    // 
    var filename = req.article.user.firstname +'_'+ req.article.user.lastname
    if (req.article.user.organization!==null){filename+=req.article.user.organization}
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': 'attachment; filename='+filename+'_'+utils.formatInvoiceNumber(req.article.number)+'.pdf',
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