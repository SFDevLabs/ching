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
  , keenClient = Keen.configure(keenConfigObj);

exports.keenConfigObj=keenConfigObj
/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

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
        return cb(null, json)
      }
    });
     
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
  }