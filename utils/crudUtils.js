/**
 * Very basic CRUD route creation utility for models.
 * For validation, simply override the model's save method.
 */

(function (exports) {

  "use strict";

  var mongoose = require('mongoose')
    , Article = mongoose.model('Article')
    , itemsSchema = require('../app/models/article').itemsSchema;

  function errMsg(msg) {
    return {'error': {'message': msg.toString()}};
  }
  function getTypeOf(data){
    console.log(itemsSchema[data])
    return itemsSchema[data]
    // if (data instanceof Date){
    //   return 'date'
    // } else{
    //   return typeof data
    // }
  }
  var formates = ['$0,0.00','0','%0.00','%0.00','','mm/dd/yy'],
      formateKeys = ['cost','qty','tax1','tax2','type','date'];
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
          first  = req.article.todos[0]
      if (first){
        var firstJSON = first.toJSON();
        for (var i in firstJSON) {
          if (i!=='_id'){
            schema[i] = getTypeOf(firstJSON[i])
            format[i] = getFormate(i)
          }
        };        
      }

      var result = {
        data: req.article.todos,
        schema: schema,
        format: format
      }

      res.send(result);
    };
  }

  //------------------------------
  // Create
  //
  function getCreateController(model) {
    return function (req, res) {
      var newTodo = req.article.todos.push({});
      req.article.save(function(err){
          if (!err) {
            res.send( req.article.todos[newTodo-1].toJSON() );
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
  // Update
  //
  function getUpdateController(model) {
    return function (req, res) {
      var key,
          todos=req.article.todos,
          index=req.todoIndex;
      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          todos[index][key] = req.body[key];
        }
      }

      req.article.save(function(err){
          if (!err) {
            res.send( req.article.todos[index].toJSON() );
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
          todos=req.article.todos;
      todos.pull(req.idt)
      req.article.save(function(err){
          if (!err) {
            res.send(204);
          } else {
            res.send(500,errMsg(err));
          }
      })

    };
  }

  function loadParams(model) {
      return function(req, res, next, idt) {
          model.findOne({
              'todos._id': idt
          }, function(err, article) {
              if (err) return next(err)
              if (!article) return next(new Error('not found'))
              var index
              article.todos.forEach(function(val, i) {
                  if (String(val._id) === idt) {
                      index = i
                  }
              });
              if (index===undefined) {
                  res.send(500, errMsg('Item Does not Exist'))
              } else {
                  req.todoIndex = index,
                  req.idt=idt;
                  next();
              }
          })
      }
  }


  exports.initRoutesForModel = function (app) {
    var model = Article,
      path,
      pathWithId;

    if (!app || !model) {
      return;
    }

    app.param('idt', loadParams(model));

    path = '/articles/:id'
    pathWithId = path + '/list/:idt';

    app.get(path+'/list', getListController(model));
    app.post(path+'/list', getCreateController(model));
    app.get(pathWithId, getReadController(model));
    app.put(pathWithId, getUpdateController(model));
    app.del(path, getDeleteController(model));
    app.del(pathWithId, getItemDeleteController(model));
  };

}(exports));
