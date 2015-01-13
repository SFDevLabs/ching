var sendgrid = require('sendgrid')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , api_key = config.sendgrid.api_key
  , api_user = config.sendgrid.api_user
  , sendgrid = require('sendgrid')(api_user, api_key)
  , Keen = require('keen.io')
  , keenConfigObj = {
      projectId: "54724e5dc9e16362d5e8880a",
      writeKey: "a4071802c282882fdd1dcd7689007e77024590f4627f520f249de08c436f323152976c0cdb26edf30f9dd23b47668176fd4bb38b207f3473817ac3b3dbf821aa30422bb3cf8623c4b51b4d8b3d2c0b72df8d3d0f1665816cbb7685b5dc42f65a1d5010a5206c62acf60e8fa4503b71b1",
      readKey: "dfcb7a388c733253fff67871b31e2308385b13ee008c31c4716b27cf80fae97be2856bf1c2df15737ccc6228f056419a11db2762642a1f0fe389463ac67b2c9466f698b3149b950171781a789f5ed3e35ee88bf79986b8ac863b41f4c7ccee1b99a107cebb44d1b132687de20074c516",
      masterKey: "E2D1D0774E040F59EBDA3032265834AC"
  }
  , keenClient = Keen.configure(keenConfigObj)
  , pdfDocument = require( "pdfkit")
  , _ = require("underscore")
  , request = require('request')
  , fs    = require('fs');

exports.keenConfigObj=keenConfigObj
/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */
var self=this;
exports.errors = function (errors) {
  var keys = Object.keys(errors)
  var errs = []

  // if there is no validation error, just display a generic error
  if (!keys) {
    return ['Oops! There was an error']
  }

  keys.forEach(function (key) {
    errs.push(errors[key].message)
  })

  return errs
}

/**
 * Index of object within an array
 *
 * @param {Array} arr
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.indexof = function (arr, obj) {
  var index = -1; // not found initially
  var keys = Object.keys(obj);
  // filter the collection with the given criterias
  var result = arr.filter(function (doc, idx) {
    // keep a counter of matched key/value pairs
    var matched = 0;

    // loop over criteria
    for (var i = keys.length - 1; i >= 0; i--) {
      if (doc[keys[i]] === obj[keys[i]]) {
        matched++;

        // check if all the criterias are matched
        if (matched === keys.length) {
          index = idx;
          return idx;
        }
      }
    };
  });
  return index;
}

/**
 * Find object in an array of objects that matches a condition
 *
 * @param {Array} arr
 * @param {Object} obj
 * @param {Function} cb - optional
 * @return {Object}
 * @api public
 */

exports.findByParam = function (arr, obj, cb) {
  var index = exports.indexof(arr, obj)
  if (~index && typeof cb === 'function') {
    return cb(undefined, arr[index])
  } else if (~index && !cb) {
    return arr[index]
  } else if (!~index && typeof cb === 'function') {
    return cb('not found')
  }
  // else undefined is returned
}

/**
 * send an email with sendgrid
 * @param  {[type]}   obj an object for the inputs to,from,subject,text;
 * @param  {Function} cb  the callback
 */
exports.sendEmail = function(obj, cb){

  if (!obj.to && typeof obj.to !=='string'){ return cb('No Valid Email')}

     sendgrid.send(obj, function(err, json) {
      if (err) { 
        return cb(err)
      } else {
        return cb(err, json)
      }
    });
     
}

/**
 * Fetch and create email
 * @param  {[string]}  location of string;
 * @return {[type]} Full text of
 */
exports.createEmail = function(location){
  if (!location){ console.error('No location strict'); return ''};
  var str = '';
  str += fs.readFileSync('./app/views/email/header.html','utf8')
  str += fs.readFileSync(location,'utf8')
  str += fs.readFileSync('./app/views/email/footer.html','utf8')
  if (typeof str !== 'string'){ console.error('Error in building email tmpl'); return ''};
  return str;
     
}


/**
 * Simple email validation
 * @param  {[type]} email and email
 * @return {[type]} Boolean for validation
 */
exports.validateEmail = function(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}


/**
 * CSV fetcher email validation
 * @param  {[files]} csv files
 * @param  {[string]} csv body text
 * @return {[string]} date in string;
 * @return {[type]} Boolean for validation
 */

exports.getcsv=function(files, body, cb){
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
 * Simple formating
 * @param  {[type]} num
 * @return {[type]} formated currency string
 */
exports.formatCurrency = function(num) {
  var p = num.toFixed(2).split(".");
  return "$" + p[0].split("").reverse().reduce(function(acc, num, i, orig) {
      return  num + (i && !(i % 3) ? "," : "") + acc;
  }, "") + "." + p[1];
};

/**
 * Simple formating
 * @param  {[type]} num
 * @return {[type]} formated formatInvoiceNumber so we have leadign strings ie 5 turns to 000005;
 */
exports.formatInvoiceNumber = function(num) {
  if (!num || typeof num !== 'number'){return false};
    var s = "000000000" + num
        , size =7;
    return s.substr(s.length-size);
};


/**
 * Messure something in keen
 * @param  {[string]} keen collection to place the data in
 * @param  {[tobjectype]} keyVals to store in event
 * @param  {[function]} the callback  
 */
exports.keenAnalytics = function(collection, keyVals, cb){
    keenClient.addEvent(collection, keyVals, function(err, res) {
      if (err && cb) {
        cb(err, null)
        console.log("Oh no, an error!", err);
      } else if (cb) {
        cb(null, res)
      }
    });
  };

/**
 * Formate a date as string
 * @param  {[date]} date object id nothing uses current date.
 * @return {[string]} date in string;
 */
exports.formateDate = function(d){
  if (!d) {d=new Date()};
  var string = '';
  string+=(d.getMonth()+1)+'/' // Returns the month
  string+=d.getDate()+'/' // Returns the date
  string+=d.getFullYear() // Returns the year
  return string;
};


/**
 * Normalize date without timezone offset.
 * @param  {[date]} date object id nothing uses current date.
 * @return {[date]} date in string;
 */
exports.defaultDate = function(d){  //We need to set the date as a canonical day so there is no timezone offset.
        var dateString = this.formateDate(d)
        return new Date(dateString)
};


/**
 * Normalize date without timezone offset.
 * @param  {[article]} article object.
 * @return {[number]} total
 */
exports.calculateTotal = function(article){  //We need to set the date as a canonical day so there is no timezone offset.
      if (!article){ return null};
      var total = article.items.map(function(val){ 
        if (val.type!=='Subtotal'){ //don't make subtotal part of the total calulation
          return val.total
        } else{
          return 0;
        }
      }).reduce(function(pVal,cVal){return pVal+cVal});
      return total;
};



/**
 * Normalize date without timezone offset.
 * @param  {[reqObj from Express]} date object id nothing uses current date.
 * @param  {[itemsSchema Object]} Schema item from model
 * @return {[PDFDoc Object]} date in string;
 */
exports.pdf= function(req, itemsSchema, cb){
    var doc = new pdfDocument();
    var m=doc.font('Helvetica', 16)
    var globalTopIndex=0;
    var drawRows = function(rows, margin,rowHeight,colPadding){
        var keys = _.keys(itemsSchema).sort(function(key,keyTwo){
              return itemsSchema[key].columnPosition>itemsSchema[keyTwo].columnPosition
            });

        var rowWidthIndexHeader = 0;
        var backgroundWidth = 540;
        
        doc.rect(margin.left-5,(margin.top)-4, backgroundWidth, rowHeight).fill('#999')
        keys.forEach(function(key, colIndex){

            //var colIndex = itemsSchema[key].columnPosition,
            var rowWidth =itemsSchema[key].printColWidth;
            
            m.font('Helvetica', 13).fillColor('#111').text(key?String(key):''
              , margin.left+rowWidthIndexHeader
              , margin.top+12 
              , {width: rowWidth,
                  height:rowHeight
                });
            rowWidthIndexHeader+=(rowWidth+colPadding);

        });
        doc.font('Helvetica', 12)
        rows.forEach(function(rowObj, rowIndex){
            var rowWidthIndex = 0;

              if (!(rowIndex % 2)){
                doc.rect(margin.left-5,(margin.top+rowHeight)+(rowHeight*rowIndex)-4, backgroundWidth, rowHeight).fill('#eee')
              }

              keys.forEach(function(key){
                  var colIndex = itemsSchema[key].columnPosition,
                      rowWidth =itemsSchema[key].printColWidth,
                      content;
                  
                  if (key==='date'){
                    content = rowObj[key]?self.formateDate(rowObj[key]):'';
                  }else if(['cost','total'].indexOf(key)!==-1){
                    //content = rowObj[key]?rowObj[key].toFixed(2):'';
                    content = rowObj[key]?self.formatCurrency(rowObj[key]):'';
                  }else if (['tax1','tax2','qty'].indexOf(key)!==-1){
                    content = rowObj[key]?rowObj[key].toFixed(2):'';
                    content = content?String(content):'';
                  }else{
                    content = rowObj[key]?String(rowObj[key]):''
                  }


                  var topindex = (margin.top+rowHeight)+(rowHeight*rowIndex)
                  doc.fillColor('black').text(
                    content, 
                    margin.left+rowWidthIndex, 
                    topindex, 
                    {width: rowWidth,
                     height:rowHeight
                   });
                   globalTopIndex=topindex
                   rowWidthIndex+=(rowWidth+colPadding); ///almost pull objects and sort them

              }) 

        });
         
    }



     

   doc
    .font('Helvetica', 18)
    .text('Invoice '+'#'+this.formatInvoiceNumber(req.article.number),{align: 'center'})
    .moveDown(1);

   var that = this
   var sender = req.article.organization? req.article.organization:req.article.user;
   request({
        url: sender.profileImageCDN+'/user_thumb_'+sender.profileImageFile,
        encoding: null // Prevents Request from converting response to string
    }, function(err, response, body) {
         // if (err) {
         //      cb(err,null);
         // };

         // Inject image
         if (!err){
          doc.image(body, 485, 20, {width:100});
         }



         if (req.article.title){
          doc.font('Helvetica', 14).fillColor('#787878 ').text('Title: '+req.article.title)
         }
         doc.font('Helvetica', 14).fillColor('#787878 ').text('Name: '+req.article.user.firstname+" "+req.article.user.lastname)
         if (req.article.user.organization){
           doc.text('Organization: '+req.article.user.organization);
         }
         
         if (req.article.invoicedOn){   
          doc.text('Invoiced on: '+ that.formateDate(req.article.invoicedOn));
         }   
         if (sender.address){
          var addressTwo =""
              addressTwo += sender.state?sender.state+', ':'',
              addressTwo += sender.zipcode?sender.zipcode:'',

              addressCity = sender.city?sender.city:'';

          doc.font('Helvetica', 14).moveDown(1).fillColor('#787878 ').text('Address:')
          doc.font('Helvetica', 14).fillColor('#787878 ').text(sender.address)
          doc.font('Helvetica', 14).fillColor('#787878 ').text(addressCity)
          doc.font('Helvetica', 14).fillColor('#787878 ').text(addressTwo)

         }  
         
         // doc.moveTo(20, 170)
         //    .lineTo(600, 170)
         //    .strokeColor('#999')
         //    .lineWidth(2)
         //    .stroke() 

          var articles = req.article.items
            , perPage = 15
            , rowHeight = 45
            , colPadding = 5
            , margin = {left:50,top:50}
            , perPageFirst = 9
            , marginFirst = {left:50,top:300}
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
         //doc.addPage()
         doc.font('Helvetica', 16).text('Total: '+that.formatCurrency(req.article.total),400,(globalTopIndex+rowHeight+30),700,100)
         
         cb(null,doc);


    });



}