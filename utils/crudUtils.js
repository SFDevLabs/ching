/**
 * Very basic CRUD route creation utility for models.
 * For validation, simply override the model's save method.
 */

(function (exports) {

  "use strict";

  var mongoose = require('mongoose')
    , Article = mongoose.model('Article')
    , itemsSchema = require('../app/models/article').itemsSchema
    , articles = require('../app/controllers/articles');

  function errMsg(msg) {
    return {'error': {'message': msg.toString()}};
  }

  function getFormate(data){
    var i=formateKeys.indexOf(data);
    if(i>=0){
      return formates[i]    
    } else{
      return ''
    }
    
  }

  //------------------------------
  // List
  //
  function getListController(articleModel) {
    return function (req, res) {
      var schema = {},
          format = {},
          dropdownOptions = {},
          first  = req.article.items[0],
          columnPosition = {},
          displayName = {},
          colWidth = {};
      
      Object.keys(itemsSchema).map(function(value, index) { //iterag over object keys
        schema[value]=itemsSchema[value].typeString
        format[value]=itemsSchema[value].format
        if (itemsSchema[value].dropdownOptions)
          dropdownOptions[value]=itemsSchema[value].dropdownOptions;
        columnPosition[value]=itemsSchema[value].columnPosition
        displayName[value]=itemsSchema[value].displayName
        colWidth[value]=itemsSchema[value].colWidth

      });

      var result = {
        data : req.article.items,
        schema : schema,
        format : format,
        columnPosition : columnPosition,
        dropdownOptions : dropdownOptions,
        displayName : displayName,
        colWidth : colWidth
      }
      res.send(result);
    }
  }

  //------------------------------
  // Create
  //
  function getCreateController(model) {
    return function (req, res) {
      var item={},
          key;
      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          item[key] = req.body[key];
        }
      }
      var newItem = req.article.items.push(item);
      req.article.save(function(err){
          if (!err) {
            res.send( req.article.items[newItem-1].toJSON() );
          } else {
            res.send(500,errMsg(err));
          }
      })

    };
  }

  //------------------------------
  // Read
  //
  function getReadController(model) {
    return function (req, res) {
      model.findById(req.params.id, function (err, result) {
        if (!err) {
          res.send(result);
        } else {
          res.send(500,errMsg(err));
        }
      });
    };
  }

  //------------------------------
  // Update All
  //
  function getUpdateController(model) {
    return function (req, res) {

      req.article.items=req.body;
      
      req.article.save(function(err){
          if (!err) {
            res.send( req.article.toJSON() );
          } else {
            res.send(500,errMsg(err));
          }
      })

    };
  }

  //------------------------------
  // Update One Item
  //
  function getUpdateItemController(model) {
    return function (req, res) {
      var key,
          items=req.article.items,
          index=req.itemIndex;
      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          items[index][key] = req.body[key];
        }
      }

      req.article.save(function(err){
          if (!err) {
            res.send( req.article.items[index].toJSON() );
          } else {
            res.send(500,errMsg(err));
          }
      })

    };
  }

  //------------------------------
  // Delete
  //
  function getDeleteController(model) {
    return function (req, res) {
      model.findById(req.params.id, function (err, result) {
        if (err) {
          res.send(errMsg(err));
        } else {
          result.remove();
          result.save(function (err) {
            if (!err) {
              res.send({});
            } else {
              res.send(errMsg(err));
            }
          });
        }
      });
    };
  }

  //------------------------------
  // Delete Item in Invoice
  //
  function  getItemDeleteController(model) {
    return function (req, res) {
      var key,
          items=req.article.items;
      items.pull(req.idt)
      req.article.save(function(err){
          if (!err) {
            res.send(204);
          } else {
            res.send(500,errMsg(err));
          }
      })

    };
  }
  //@TODO
  //------------------------------
  // Add Item in Invoice at position
  //
  function  getItemAddController(model) {
    return function (req, res) {
      var key;

      //req.article.update({ "$push": { "items": { "$each": [{}], "$position": req.idt } } });

      // req.article.save(function(err){
      //     if (!err) {
      //       res.send(204);
      //     } else {
      //       res.send(500,errMsg(err));
      //     }
      // })

    };
  }

  function loadParams(model) {
      return function(req, res, next, idt) {
          model.findOne({
              'items._id': idt
          }, function(err, article) {
              if (err) return next(err)
              if (!article) return next(new Error('not found'))
              var index
              article.items.forEach(function(val, i) {
                  if (String(val._id) === idt) {
                      index = i
                  }
              });
              if (index===undefined) {
                  res.send(500, errMsg('Item Does not Exist'))
              } else {
                  req.itemIndex = index,
                  req.idt=idt;
                  next();
              }
          })
      }
  }


  var Keen = require('keen.io');

  var client = Keen.configure({
      projectId: "546dc37b36bca44b4bfcaf3e",
      writeKey: "8af6a1cc9a40021100e789f9010922a866fc7cafaeef7556217dd596738d779b0210ba1c45d11b5690865525fe9c05360e5aa344847617486eee4efe1a14575ecad3fce442b2c6c707c482b1c3a824914a216f64c76da2afbcde668c0095788281eb33f6c286678e43ad328eb0996717",
      readKey: "f631dfd829dba39d1d8efa8b22b6397ba7276991180db8733dbf354d2b645ef4b916bb3e71b9f6309a6181664a5ab2fb823cfdc3a3adec14a6e30dcbcb9783054cbdb4d8b5d1e97c14fca2a0a78abd793184a018057dd9e8b997196bd619984fb2ff3faa93a37580976b86b24658c1d2",
      masterKey: "56431B491A7ADDAA1DACA079F6165952"
  });

  var Analytics = function(collection, keyVals, cb){
    client.addEvent(collection, keyVals, function(err, res) {
      if (err && cb) {
        cb(err, null)
          console.log("Oh no, an error!", err);
      } else if (cb) {
        cb(null, res)
      }
    });
  }
  var apiRoute=function(route){
    console.log(route)
    return function(req, res, next){
          Analytics('event',{type:route, user:req.user.id})
          next();
    }
  }

  exports.initRoutesForModel = function (app, auth) {
    var model = Article
      , path
      , pathWithId
      , articleAuth = [auth.requiresLogin, auth.article.hasEditAuthorizationAPI]
      , viewerAuth = [auth.requiresLogin, auth.article.hasViewAuthorization]
      , viewerAuthToken = [auth.article.hasViewAuthorizationToken];

    if (!app || !model) {
      return;
    }

    app.param('token', articles.token);
    app.param('idt', loadParams(model));

    path = '/articles/:id'
    pathWithId = path + '/api/:idt';



    app.get(path+'/api', viewerAuth, apiRoute('API_ItemsList'), getListController(model));
    app.get(path+'/api/token/:token', apiRoute('API_ItemsList_Token'), viewerAuthToken, getListController(model));
    app.post(path+'/api', articleAuth, apiRoute('API_PostItems'), getCreateController(model));
    app.get(pathWithId, articleAuth, apiRoute('API_GetItemsById'), getReadController(model));
    //app.put(path+'/api', articleAuth, apiRoute('API_PutAllItems'), getUpdateController(model));
    app.put(pathWithId, articleAuth, apiRoute('API_PutById'), getUpdateItemController(model));
    //app.del(path, articleAuth, apiRoute('API_Delete'), getDeleteController(model)); //Depricated
    app.del(pathWithId, articleAuth, apiRoute('API_DeletebyId'), getItemDeleteController(model));
  };

}(exports));
