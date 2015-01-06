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

var OrgSchema = new Schema({
  name: { type: String, default: '' },
  address: { type: String, default: '' },
  zipcode: { type: String, default: '' },
  url: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  profileImageFile: {type : String, default : ''},
  profileImageCDN: {type : String, default : ''}
});

/**
 * Virtuals
 */

OrgSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });



OrgSchema.statics = {

    /**
   * Get User email
   */

  // userEmail: function (options, cb) {
  //   this.findOne(options)
  //     //.populate('user', 'name username')
  //     //.sort({'createdAt': -1}) // sort by date
  //     //.limit(options.perPage)
  //     //.skip(options.perPage * options.page)
  //     .exec(cb)
  // }

};

/**
 * Methods
 */

OrgSchema.methods = {

  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
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

mongoose.model('Org', OrgSchema);