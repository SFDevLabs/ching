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
          options = {},
          first  = req.article.todos[0],
          columnPosition = {};
      if (first){
        var firstJSON = first.toJSON();
        for (var i in firstJSON) {
          if (i!=='_id' && itemsSchema[i]){
            schema[i] = itemsSchema[i].typeString? itemsSchema[i].typeString:'';
            format[i] = itemsSchema[i].format? itemsSchema[i].format:'';
            if (itemsSchema[i].dropdownOptions){options[i] = itemsSchema[i].dropdownOptions};
            columnPosition[i] = typeof itemsSchema[i].columnPosition=='number'? itemsSchema[i].columnPosition:null;
          }
        };        
      }

      var result = {
        data : req.article.todos,
        schema : schema,
        format : format,
        columnPosition : columnPosition,
        dropdownOptions : options
      }

      res.send(result);
    };
  }

  //------------------------------
  // Create
  //
  function getCreateController(model) {
    return function (req, res) {
      var todo={},
          key;
      for (key in req.body) {
        if (key!=='_id' && key!=='createdAt'){
          todo[key] = req.body[key];
        }
      }
      var newTodo = req.article.todos.push(todo);
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
  // Update All
  //
  function getUpdateController(model) {
    return function (req, res) {

      req.article.todos=req.body;
      
      console.log(req.article.todos);
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
    pathWithId = path + '/api/:idt';

    app.get(path+'/api', getListController(model));
    app.post(path+'/api', getCreateController(model));
    app.get(pathWithId, getReadController(model));
    app.put(path+'/api', getUpdateController(model));
    app.put(pathWithId, getUpdateItemController(model));
    app.del(path, getDeleteController(model));
    app.del(pathWithId, getItemDeleteController(model));
  };

}(exports));
