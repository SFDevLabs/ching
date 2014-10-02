
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Imager = require('Imager')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , imagerConfig = require(config.root + '/config/imager.js')
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
    note:{type : String, default :  null, format: '', typeString:'string',columnPosition:7, displayName:'Note', colWidth:180},
    date: {type: Date, default : null, format: 'mm/dd/yy', typeString:'date',columnPosition:3, displayName:'Date', colWidth:100},
    cost:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:1, displayName:'Cost/Rate', colWidth:160},
    qty:{type : Number, default : null, format: '0,0[.]0000', typeString:'number',columnPosition:2, displayName:'Quantity/Hours', colWidth:160},
    tax1:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:4, displayName:'Tax 1', colWidth:60},
    tax2:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:5, displayName:'Tax 2', colWidth:60},
    type:{type : String, default : 'Time', format: 'dropdown', dropdownOptions: ['Time','Item'], typeString:'string',columnPosition:6, displayName:'Time | Item', colWidth:80},
    item:{type : String, default : null, format: '', typeString:'string',columnPosition:0, displayName:'Item/Service Desc.', colWidth:180},
    total:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:8, displayName:'Total', colWidth:100}
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

var ArticleSchema = new Schema({
  viewers:[viewersSchema],
  views: [viewsSchema],
  title: {type : String, default : '', trim : true},
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
  status: {type : String, default : 'draft', trim : true},
  addresss: {type : String, default : 'draft', trim : true},
  currency: {type : String, default : 'USD', trim : true}

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
      val = null;
    }
    console.log(val
      )
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

ArticleSchema.pre('remove', function (next) {
  var imager = new Imager(imagerConfig, 'S3')
  var files = this.image.files

  // if there are files associated with the item, remove from the cloud too
  imager.remove(files, function (err) {
    if (err) return next(err)
  }, 'article')

  next()
})

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
