
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema
  , utils = require('../../lib/utils')

/**
 * Getters
 */

var getTags = function (tags) {
  return tags.join(',')
}

/**
 * Setters
 */

var setTags = function (tags) {
  return tags.split(',')
}

/**
 * Article Schema
 */

  var formates = [,,'%0.00','%0.00','','mm/dd/yy'],
      formateKeys = ['cost','qty','tax1','tax2','type','date'];

var itemsSchema = {
    note:{type : String, default :  null, format: '', typeString:'string',columnPosition:7, displayName:'Note', colWidth:180, printColWidth:120},
    date: {type: Date, default : null, format: 'mm/dd/yy', typeString:'date',columnPosition:3, displayName:'Date', colWidth:100, printColWidth:55},
    cost:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:1, displayName:'Cost/Rate', colWidth:160, printColWidth:60},
    qty:{type : Number, default : null, format: '0,0[.]0000', typeString:'number',columnPosition:2, displayName:'Quantity/Hours', colWidth:150, printColWidth:30},
    tax1:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:4, displayName:'Tax 1', colWidth:60, printColWidth:30},
    tax2:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:5, displayName:'Tax 2', colWidth:60, printColWidth:30},
    type:{type : String, default : 'Time', format: 'dropdown', dropdownOptions: ['Time','Item'], typeString:'string',columnPosition:6, displayName:'Time | Item', colWidth:80, printColWidth:30},
    item:{type : String, default : null, format: '', typeString:'string',columnPosition:0, displayName:'Item/Service Desc.', colWidth:180, printColWidth:95},
    total:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:8, displayName:'Total', colWidth:100, printColWidth:120},
  }
  var viewersSchema = new Schema({
    user: {type : Schema.ObjectId, ref : 'User'},
    createdAt: { type : Date, default : Date.now },
  })
  var viewsSchema = new Schema({
    user: {type : Schema.ObjectId, ref : 'User'},
    viewedAt: { type : Date, default : Date.now },
  })
  exports.itemsSchema = itemsSchema;

var nextNumber = function(){
  return 1;
}
var ArticleSchema = new Schema({
  number:{type : Number},
  viewers:[viewersSchema],
  views: [viewsSchema],
  notificationSent:[{
    user: {type : Schema.ObjectId, ref : 'User'},
    createdAt: { type : Date, default : Date.now },
    type: {type : String, default : '', trim : true},
  }],
  description: {type : String, default : '', trim : true},
  user: {type : Schema.ObjectId, ref : 'User'},
  comments: [{
    body: { type : String, default : '' },
    user: { type : Schema.ObjectId, ref : 'User' },
    createdAt: { type : Date, default : Date.now }
  }],
  tags: {type: [], get: getTags, set: setTags},
  image: {
    cdnUri: String,
    files: []
  },
  createdAt  : {type : Date, default : Date.now},
  items: [itemsSchema],
  invoicedOn:{type : Date, default : null},
  paidOn:{type : Date, default : null},
  paymentVerified : { type: Boolean, default: false },
  dueOn:{type : Date, default : null},
  address: {type : String, default : '', trim : true},
  currency: {type : String, default : 'USD', trim : true},
});

ArticleSchema
  .virtual('total')
  // .set(function(password) {
  //   this._password = password
  //   this.salt = this.makeSalt()
  //   this.hashed_password = this.encryptPassword(password)
  // })
  .get(function() { 
    var val
    if (this.items.length){
      val = this.items.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal}) 
    }else{
      val = 0;
    }
    return val

  })


ArticleSchema
  .virtual('status')
  // .set(function(password) {
  //   this._password = password
  //   this.salt = this.makeSalt()
  //   this.hashed_password = this.encryptPassword(password)
  // })
  .get(function() { 
     var val
      if (this.invoicedOn===null)
        val='draft'
      else if (this.paidOn!==null){
        val='paid'
      }else if (this.paidOn===null && this.dueOn && new Date()>this.dueOn){
        val='overdue'
      } else if (this.invoicedOn!==null){
        val='sent'
      }

      return val

  })




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

  // uploadAndSave: function (images, cb) {
  //   if (!images || !images.length) return this.save(cb)

  //   var imager = new Imager(imagerConfig, 'S3')
  //   var self = this

  //   this.validate(function (err) {
  //     if (err) return cb(err);
  //     imager.upload(images, function (err, cdnUri, files) {
  //       if (err) return cb(err)
  //       if (files.length) {
  //         self.image = { cdnUri : cdnUri, files : files }
  //       }
  //       self.save(cb)
  //     }, 'article')
  //   })
  // },

  /**
   * Add comment
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addComment: function (user, comment, cb) {
    var notify = require('../mailer')

    this.comments.push({
      body: comment.body,
      user: user._id
    })

    //if (!this.user.email) this.user.email = 'email@product.com'
    // notify.comment({
    //   article: this,
    //   currentUser: user,
    //   comment: comment.body
    // })

    this.save(cb)
  },

  /**
   * Remove comment
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeComment: function (commentId, cb) {
    var index = utils.indexof(this.comments, { id: commentId })
    if (~index) this.comments.splice(index, 1)
    else return cb('not found')
    this.save(cb)
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
      cb(err,obj,newViewer)
    })
  },

  /**
   * Remove viewer
   *
   * @param {commentId} String
   * @param {Function} cb
   * @api private
   */

  removeViewer: function (viewerId, cb) {
    var index = utils.indexof(this.viewers, { id: viewerId })
    if (~index) this.viewers.splice(index, 1)
    else return cb('not found')
    this.save(cb)
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
      cb(err,obj,newViewer)
    })
  },
}

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
      .populate('user', 'firstname email lastname, organization')
      .populate('comments.user')
      .populate('viewers.user', 'lastname email firstname organization')
      .populate('views.user', 'lastname email firstname organization')
      .exec(cb)
  },

  highestNumber: function (userId, cb) {
    var number;
    this.find({user:userId})
        .limit( 1 )
        .sort( {number:-1} )
        .exec(function(err, highest){
            if (err) { cb(err,null)};            
            if (highest.length && typeof highest[0].number==='number'){
              number = highest[0].number+1
            }else{
              number = 1
            };
            cb(null,number)
        })
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(options.criteria)
      // .or([
      //     options.criteria
      //   ,{'viewers':{$elemMatch: {user:options.criteria.user } } }
      // ])
      // .where('viewers')
      // .in([options.criteria.user])
      .populate('user', 'firstname email lastname organization')
      .populate('viewers.user', 'firstname email lastname organization')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb)
  }

}

mongoose.model('Article', ArticleSchema)
