'use strict';
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema
  , utils = require('../../lib/utils')
  , Imager = require('imager')
  , imagerConfig = require(config.root + '/config/imager.js')
  , _ = require("underscore")
  , knox = require("knox")
  , client = knox.createClient({
    key: imagerConfig.storage.S3.key
  , secret: imagerConfig.storage.S3.secret
  , bucket: imagerConfig.storage.S3.bucket
}),
  cdnBucketURI = "http://"+imagerConfig.storage.S3.bucket+".s3.amazonaws.com";
/**
 * Getters
 */

// var getTags = function (tags) {
//   return tags.join(',');
// };

/**
 * Setters
 */

// var setTags = function (tags) {
//   return tags.split(',');
// };

/**
 * Article Schema
 */

var itemsSchema = {
    note:{type : String, default :  null, format: '', typeString:'string',columnPosition:7, displayName:'Note', colWidth:180, printColWidth:80},
    date: {type: Date, default : null, format: 'mm/dd/yy, D', typeString:'date',columnPosition:3, displayName:'Date', colWidth:135, printColWidth:65},
    cost:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:1, displayName:'Unit Price', colWidth:120, printColWidth:60},
    qty:{type : Number, default : null, format: '0,0[.]0000', typeString:'number',columnPosition:2, displayName:'Quantity', colWidth:120, printColWidth:40},
    tax1:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:4, displayName:'Tax (1)', colWidth:60, printColWidth:30},
    tax2:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:5, displayName:'Tax (2)', colWidth:60, printColWidth:30},
    type:{type : String, default : 'Time', format: 'dropdown', dropdownOptions: ['Time','Item'], typeString:'string',columnPosition:6, displayName:'Time | Item', colWidth:90, printColWidth:40},
    item:{type : String, default : null, format: '', typeString:'string',columnPosition:0, displayName:'Description', colWidth:195, printColWidth:80},
  //  subtotals:[{type : String, default : null, format: '', typeString:'string'}],
    total:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:8, displayName:'Total', colWidth:100, printColWidth:120},
  };

  var viewersSchema = new Schema({
    user: {type : Schema.ObjectId, ref : 'User'},
    createdAt: { type : Date, default : Date.now },
  });
  var viewsSchema = new Schema({ //turn this into events
    user: {type : Schema.ObjectId, ref : 'User'},
    viewedAt: { type : Date, default : Date.now },
    type: {type : String, default : '', trim : true}
  });
  exports.itemsSchemaExport = function(){
    return _.extend({}, itemsSchema);
  };

var ArticleSchema = new Schema({
  number:{type : Number, unique: true },
  viewers:[viewersSchema],
  title: {type : String, default : '', trim : true},
  views: [viewsSchema],
  // notificationSent:[{
  //   user: {type : Schema.ObjectId, ref : 'User'},
  //   createdAt: { type : Date, default : Date.now },
  //   type: {type : String, default : '', trim : true},
  // }],
  images:[{
    user: {type : Schema.ObjectId, ref : 'User'},
    createdAt: { type : Date, default : Date.now },
    file: {type : String, default : '', trim : true},
    cdnUri: {type : String, default : '', trim : true},
    fileType: {type : String, default:null},
    fileName: {type : String, default:null},
    itemReference: {type : String, default:null}
  }],
  description: {type : String, default : '', trim : true},
  user: {type : Schema.ObjectId, ref : 'User'},
  organization: {type : Schema.ObjectId, ref : 'Org'},
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    isPayment: { type: Boolean, default: false },
    createdAt: { type : Date, default : Date.now }
  }],
  tags: {type: [], get: getTags, set: setTags},
  createdAt  : {type : Date, default : Date.now},
  invoicedOn:{type : Date, default : null},
  paidOn:{type : Date, default : null},
  paymentVerifiedOn : {type : Date, default : null},
  dueOn:{type : Date, default : null},
  items: [itemsSchema],
  currency: {type : String, default : 'USD', trim : true},
  total:{type : Number, default : 0},
});

// ArticleSchema
//   .virtual('total')
//   // .set(function(password) {
//   //   this._password = password
//   //   this.salt = this.makeSalt()
//   //   this.hashed_password = this.encryptPassword(password)
//   // })
//   .get(function() {
//     var val
//     if (this.items.length){
//       val = this.items.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal})
//     }else{
//       val = 0;
//     }
//     return val

//   })

ArticleSchema
  .virtual('status')
  .get(function() {// This logic and the templates that use it could be better thought out.
     var val;
      if (this.paymentVerifiedOn!==null){
        val='verified';
      }else if (this.paidOn!==null){
        val='paid';
      }else if (this.invoicedOn===null){
        val='draft';
      }else if (this.paidOn===null && this.dueOn && new Date()>this.dueOn){
        val='overdue';
      } else if (this.invoicedOn!==null && this.views && this.views.length>0){
        val='viewed';
      } else if (this.invoicedOn!==null){
        val='sent';
      }

      return val;

  });




/**
 * Validations
 */

// ArticleSchema.path('title').required(true, 'Article title cannot be blank');
// ArticleSchema.path('body').required(true, 'Article body cannot be blank');

/**
 * Pre-remove hook
 */

// ArticleSchema.pre('remove', function (next) {
//   var imager = new Imager(imagerConfig, 'S3')
//   var files = this.image.files

//   // if there are files associated with the item, remove from the cloud too
//   imager.remove(files, function (err) {
//     if (err) return next(err)
//   }, 'article')

//   next()
// })

/**
 * Methods
 */

ArticleSchema.methods = {

  /**
   * Save article and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */

  uploadAndSave: function (images, userId, cb) {
          //console.log(images)

    //if (!images || !images.length) return this.save(cb);

    var imager = new Imager(imagerConfig, 'S3');
    var self = this;

    this.validate(function (err) {
      console.log(images)
      if (err) return cb(err);
      if (images[0] && images[0].type && images[0].type.search(/image/)!==-1){
        var name = images[0].name;
        imager.upload(images, function (err, cdnUri, files) {
          if (err) return cb(err);
          if (files.length) {
            files.forEach(function(val){
              self.images.push({ cdnUri : cdnBucketURI, file : val, user:userId, fileName: name, fileType:'image'});
            });
          }
          self.save(cb);
        }, 'article');
      }else if (images[0]){
        var time = new Date().getTime().toString();
        var path = images[0].path;
        var ext = path.match(/\.[0-9a-z]+$/i)
        var fileName = time+ext;
        var name = images[0].name;
        client.putFile(path, 'file_'+fileName, function(err, res){
          console.log(err, res)
          self.images.push({ cdnUri : cdnBucketURI, file : fileName, user:userId, fileType:'file', fileName: name});
          self.save(cb);
            // Always either do something with `res` or at least call `res.resume()`.
        });
      }

    });
  },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addComment: function (user, comment, cb) {
    this.comments.push({
      body: comment.body,
      user: user._id
    });
    this.save(cb);
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeComment: function (commentId, cb) {
    var index = utils.indexof(this.comments, { id: commentId });
    if (~index) this.comments.splice(index, 1);
    else return cb('not found');
    this.save(cb);
  },



   /**
    * addViewer to article,  Get viewer token
    * @param {[type]}   user mongoobj
    * @param {Function} cb   error,savedDocument,addedViewerObj
    */
  addViewer: function (user, cb) {
    //var notify = require('../mailer')

    var newViewer = this.viewers.addToSet(user);

    // if (!this.user.email) this.user.email = 'email@product.com'
    // notify.comment({
    //   article: this,
    //   currentUser: user,
    //   comment: comment.body
    // })

    this.save(function(err,obj){
      cb(err,obj,newViewer);
    });
  },

  /**
   * Remove viewer
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeViewer: function (viewerId, cb) {
    var index = utils.indexof(this.viewers, { id: viewerId });
    if (~index) this.viewers.splice(index, 1);
    else return cb('not found');
    this.save(cb);
  },

   /**
    * addViewer to article,  Get viewer token
    * @param {[type]}   user mongoobj
    * @param {Function} cb   error,savedDocument,addedViewerObj
    */
  addPageView: function (user, cb) {
    //var notify = require('../mailer')

    var newViewer = this.views.addToSet(user);

    // if (!this.user.email) this.user.email = 'email@product.com'
    // notify.comment({
    //   article: this,
    //   currentUser: user,
    //   comment: comment.body
    // })

    this.save(function(err,obj){
      cb(err,obj,newViewer);
    });
  },
};

/**
 * Statics
 */

ArticleSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id : id })
      .populate('user', 'lastname firstname email organization profileImageCDN profileImageFile address city state zipcode')
      .populate('comments.user')
      .populate('viewers.user', 'lastname email firstname')
      .populate('views.user', 'lastname email firstname')
      .populate('images.user', 'lastname email firstname')
      .populate('organization')
      .exec(cb);
  },

  highestNumber: function (userId, cb) {
    var number;
    this.find({user:userId})
        .limit( 1 )
        .sort( {number:-1} )
        .exec(function(err, highest){
            if (err) { cb(err,null);}
            if (highest.length && typeof highest[0].number==='number'){
              number = highest[0].number+1;
            }else{
              number = 1;
            }
            cb(null,number);
        });
  },

  /**
   * Graph API articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  graph: function (options, cb) {
    var criteria = options.criteria || {};

    this
    .find(criteria, { paymentVerifiedOn:1, invoicedOn:1, dueOn:1, createdAt:1, paidOn:1, total:1 })
      //.project({ paidOn : 1 })
      // .or([
      //     options.criteria
      //   ,{'viewers':{$elemMatch: {user:options.criteria.user } } }
      // ])
      // .where('viewers')
      // .in([options.criteria.user])
      //
      // .populate('user', 'firstname email lastname organization')
      // .populate('viewers.user', 'firstname email lastname organization')
      //.sort({'createdAt': -1}) // sort by date
      //.limit(options.perPage)
      //.skip(options.perPage * options.page)
      .lean()
      .exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};

    this.find(criteria, { user:1,viewers:1, tags:1, total:1, number:1, paymentVerifiedOn:1, invoicedOn:1, dueOn:1, createdAt:1, paidOn:1, title:1, organization:1, views:1 })
      // .or([
      //     options.criteria
      //   ,{'viewers':{$elemMatch: {user:options.criteria.user } } }
      // ])
      // .where('viewers')
      // .in([options.criteria.user])
      //
      .populate('user', 'firstname email lastname organization')
      .populate('viewers.user', 'firstname email lastname organization')
      .populate('organization')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  },


  /**
   * Total articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */
  all:function (options,cb){

      this.find(options.criteria)
      .populate('user', 'firstname email lastname organization')
      .populate('viewers.user', 'firstname email lastname organization')
      .sort({'createdAt': -1})
      .exec(cb);
  },

  total: function (options, cb) {//@TODO clean me up
    var criteria = options.criteria || {};

    this.aggregate( [ { $match : criteria},
                      { $unwind : '$items' },
                      { $group : { _id : null , total : { $sum : '$items.total' } } }
                      //{ $group: { _id: null, count: { $sum: 1 } } }
                     ] ).exec(function(err,res){
                        // console.log(err,res,res2, 'agg')
                        if (err || res === undefined){
                          cb(err, 0);
                        }
                        console.log(res,'resres')
                        var total;
                        if (res[0]){
                         total = res[0].total;
                        }else{
                          total=0;
                        }
                        cb(null, total);
                       });

  }


};

mongoose.model('Article', ArticleSchema);
