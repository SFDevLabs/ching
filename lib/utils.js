var sendgrid = require('sendgrid')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , api_key = config.sendgrid.api_key
  , api_user = config.sendgrid.api_user
  , sendgrid = require('sendgrid')(api_user, api_key)
  , Keen = require('keen.io')
  , keenClient = Keen.configure({
      projectId: "546dc37b36bca44b4bfcaf3e",
      writeKey: "8af6a1cc9a40021100e789f9010922a866fc7cafaeef7556217dd596738d779b0210ba1c45d11b5690865525fe9c05360e5aa344847617486eee4efe1a14575ecad3fce442b2c6c707c482b1c3a824914a216f64c76da2afbcde668c0095788281eb33f6c286678e43ad328eb0996717",
      readKey: "f631dfd829dba39d1d8efa8b22b6397ba7276991180db8733dbf354d2b645ef4b916bb3e71b9f6309a6181664a5ab2fb823cfdc3a3adec14a6e30dcbcb9783054cbdb4d8b5d1e97c14fca2a0a78abd793184a018057dd9e8b997196bd619984fb2ff3faa93a37580976b86b24658c1d2",
      masterKey: "56431B491A7ADDAA1DACA079F6165952"
  });

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