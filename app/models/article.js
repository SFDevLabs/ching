
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Imager = require('imager')
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
    note:{type : String, default :  null, format: '', typeString:'string',columnPosition:0},
    date: {type: Date, default : null, format: 'mm/dd/yy', typeString:'date',columnPosition:1},
    cost:{type : Number, default : null, format: '$0,0.00', typeString:'number',columnPosition:2},
    qty:{type : Number, default : null, format: '0,0.00', typeString:'number',columnPosition:3},
    tax1:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:4},
    tax2:{type : Number, default : null, format: '%0.00', typeString:'number',columnPosition:5},
    type:{type : String, default : null, format: 'dropdown', dropdownOptions: ['Time','Item'], typeString:'string',columnPosition:6},
    item:{type : String, default : null, format: '', typeString:'string',columnPosition:7},
    total:{type : Number, default : null, format: '$0,0.00', typeString:'number',columnPosition:8}
  }
  var viewersSchema = new Schema({
    user: {type : Schema.ObjectId, ref : 'User'},
    createdAt: { type : Date, default : Date.now },
  })
  exports.itemsSchema = itemsSchema;

var ArticleSchema = new Schema({
  viewers:[viewersSchema],
  title: {type : String, default : '', trim : true},
  body: {type : String, default : '', trim : true},
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
  todos: [itemsSchema]
});

/**
 * Validations
 */

ArticleSchema.path('title').required(true, 'Article title cannot be blank');
ArticleSchema.path('body').required(true, 'Article body cannot be blank');

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

    if (!this.user.email) this.user.email = 'email@product.com'
    notify.comment({
      article: this,
      currentUser: user,
      comment: comment.body
    })

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
   * Add viewer
   *
   * @param {User} user
   * @param {Object} comment
   * @param {Function} cb
   * @api private
   */

  addViewer: function (comment, cb) {
    //var notify = require('../mailer')

    this.viewers.addToSet(comment)

    // if (!this.user.email) this.user.email = 'email@product.com'
    // notify.comment({
    //   article: this,
    //   currentUser: user,
    //   comment: comment.body
    // })

    this.save(cb)
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
  }
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
      .populate('user', 'name email username')
      .populate('comments.user')
      .populate('viewers.user', 'name email username')
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

    this.find()
      .or([
          options.criteria
        ,{$in:{'viewers':[options.criteria.user]}}
      ])
      // .where('viewers')
      // .in([options.criteria.user])
      .populate('user', 'name username')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb)
  }

}

mongoose.model('Article', ArticleSchema)
