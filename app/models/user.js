'use strict';
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , oAuthTypes = ['github', 'twitter', 'facebook', 'google', 'linkedin']
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Imager = require('imager')
  , imagerConfig = require(config.root + '/config/imager.js')
  , _ = require("underscore");
/**
 * User Schema
 */

var UserSchema = new Schema({
  firstname: { type: String, default: '' },
  lastname: { type: String, default: '' },
  email: { type: String, default: '' },
  //organization:{ type: String, default: '' },
  organizations:[{
    org : {type : Schema.ObjectId, ref : 'Org'},
    isAdmin: { type: Boolean, default: false }
  }],
  defautOrgIndex: { type: Number, default: null },
  address: { type: String, default: '' },
  zipcode: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  profileImageFile: {type : String, default : ''},
  profileImageCDN: {type : String, default : ''},
  provider: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  authToken: { type: String, default: '' },
  facebook: {},
  twitter: {},
  github: {},
  google: {},
  linkedin: {},
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  placeholderFromShare: { type: Boolean, default: false },
});

/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function(){return this._password;});

/**
 * Validations
 */

var validatePresenceOf = function (value) {
  return value && value.length;
};

// the below 5 validations only apply if you are signing up traditionally

UserSchema.path('email').validate(function (email) {
  if (this.doesNotRequireValidation() || this.placeholderFromShare) return true;
  return email.length;
}, 'Email cannot be blank');


UserSchema.path('hashed_password').validate(function (hashed_password) {
  if (this.doesNotRequireValidation() || this.placeholderFromShare ) return true;
  return hashed_password.length;
}, 'Password cannot be blank');


/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
  if (!this.isNew || this.placeholderFromShare) return next();

  if (!validatePresenceOf(this.password) && !this.doesNotRequireValidation()){
    next(new Error('Invalid password'));
  }else
    next();
});


UserSchema.statics = {

    /**
   * Get User email
   */

  orgMember: function (id, cb) {
    this.find({
      organizations:{
        $elemMatch:{
          org: id
        }
      }
    })
      //.populate('user', 'name username')
      //.sort({'createdAt': -1}) // sort by date
      //.limit(options.perPage)
      //.skip(options.perPage * options.page)
      .exec(cb);
  },

    /**
   * Get Org email
   */

  userEmail: function (options, cb) {
    this.findOne(options)
      //.populate('user', 'name username')
      //.sort({'createdAt': -1}) // sort by date
      //.limit(options.perPage)
      //.skip(options.perPage * options.page)
      .exec(cb);
  }

};

/**
 * Methods
 */

UserSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */

  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */

  makeSalt: function () {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */

  encryptPassword: function (password) {
    if (!password) return '';
    var encrypred;
    try {
      encrypred = crypto.createHmac('sha1', this.salt).update(password).digest('hex');
      return encrypred;
    } catch (err) {
      return '';
    }
  },

  /**
   * Validation is not required if using OAuth
   */

  doesNotRequireValidation: function() {
    return ~oAuthTypes.indexOf(this.provider);
  },
    /**
   * Save article and upload image
   *
   * @param {Object} images
   * @param {Function} cb
   * @api private
   */

  uploadAndSave: function (images, userId, cb) {

    var imager = new Imager(imagerConfig, 'S3');
    var self = this;

    this.validate(function (err) {
      if (err) return cb(err);
      imager.upload(images, function (err, cdnUri, files) {
        if (err) return cb(err);
        if (files.length) {
          files.forEach(function(val){
            self.profileImageCDN=cdnUri;
            self.profileImageFile=val;
          });
        }
        self.save(cb);
      }, 'user');
    });
  }
};

mongoose.model('User', UserSchema);