/**
 * Very basic CRUD route creation utility for models.
 * For validation, simply override the model's save method.
 */

(function (exports) {

  "use strict";

  var mongoose = require('mongoose')
    , Article = mongoose.model('Article')
    , itemsSchema = require('../app/models/article').itemsSchemaExport()//_.extend({}, require('../app/models/article').itemsSchema) //we need to make copy of the schma to keep the original intacts
    , articles = require('../app/controllers/articles')
    , utils = require('../lib/utils')
    , _ = require("underscore");


   itemsSchema['click']={format: 'buttons', typeString:'string',columnPosition:9, displayName:'Clicky', colWidth:50};//Adding a click row to our item schema.

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
          key,
          index;
      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          item[key] = req.body[key];
        }
      }
      var newItem = req.article.items.push(item);
      req.article.total = utils.calculateTotal(req.article)

      //req.article.items.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal});

      req.article.save(function(err){
          if (!err) {
            //res.send(200)
            res.send( req.article.items[newItem-1].toJSON() );
          } else {
            console.log(err)
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

      req.article.total = utils.calculateTotal(req.article)

//      req.article.total = req.article._.uni.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal});

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
         if (key==='subtotals' && req.body[key]!==null){//if the item is a subtotal make sure we put in a unique list of subtotals
          items[index][key] = _.unique(req.body.subtotals)
         }
         //  else if (key==='total' && items[index]['type']==='Subtotal'){

         //  //items[index][key]=null; //make it zero,  Its a subtotal
         //  //do nothing we dont want to save the subtotals, they are calcualted by the fornt end.
         // }
         else if (key!=='_id' && key!=='createdAt') {
          items[index][key] = req.body[key];
        }
      }
      req.article.total = utils.calculateTotal(req.article)

  //    req.article.total = req.article.items.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal});

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
      
      if (req.article.total>0){ //if there is nothing in the array it is a total of Zero.
        //req.article.total = req.article.items.map(function(val){ return val.total }).reduce(function(pVal,cVal){return pVal+cVal});
        req.article.total = utils.calculateTotal(req.article)

      }else{
        req.article.total=0;
      }

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
      var key,
          item={};

      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          item[key] = req.body[key];
        }
      }
      req.article.update({ "$push": {items:{ ///mongoose has no $positon support so we just need to add the item and refresh the grid
          $each:[{}],
          $position: item.index && !isNaN(Number(item.index))?Number(item.index):0
          }
         }
        },
        function(err){
          if (!err) {
            res.send(204,'ok');
          } else {
            res.send(500,errMsg(err));
          }
        });
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

  var analyticsRoute=function(collection,route){
    return  function(req, res, next){
          // var data = {//turning off api analytics too much
          //   type:route
          //   , user:req.user?req.user.id:null
          //   , session:req.sessionID?req.sessionID:null
          // }
          // utils.keenAnalytics(collection,data)
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



    app.get(path+'/api', viewerAuth, analyticsRoute('user_event','API_ItemsList'), getListController(model));
    app.post(path+'/api/add', articleAuth, analyticsRoute('user_event','API_AddbyPositionById'), getItemAddController(model));
    app.get(path+'/api/token/:token', analyticsRoute('user_event','API_ItemsList_Token'), viewerAuthToken, getListController(model));
    app.post(path+'/api', articleAuth, analyticsRoute('user_event','API_PostItems'), getCreateController(model));
    app.get(pathWithId, articleAuth, analyticsRoute('user_event','API_GetItemsById'), getReadController(model));
    app.put(path+'/api', articleAuth, analyticsRoute('API_PutAllItems'), getUpdateController(model));
    app.put(pathWithId, articleAuth, analyticsRoute('user_event','API_PutById'), getUpdateItemController(model));
    //app.del(path, articleAuth, analyticsRoute('API_Delete'), getDeleteController(model)); //Depricated
    app.del(pathWithId, articleAuth, analyticsRoute('user_event','API_DeletebyId'), getItemDeleteController(model));
  };

}(exports));
