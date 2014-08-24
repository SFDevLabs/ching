/**
 * Very basic CRUD route creation utility for models.
 * For validation, simply override the model's save method.
 */

(function (exports) {

  "use strict";

  var mongoose = require('mongoose')
    , Article = mongoose.model('Article');

  function errMsg(msg) {
    return {'error': {'message': msg.toString()}};
  }
  function getTypeOf(data){
    if (data instanceof Date){
      return 'date'
    } else{
      return typeof data
    }
  }
  var formates = ['$0,0.00','0','%0.00','%0.00','','mm/dd/yy'],
      formateKeys = ['cost','qty','tax1','tax2','type','date'];
  function getFormate(data){
    var i=formateKeys.indexOf(data);
        console.log(data,i,formates[i])

    if(i>0){
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
      //console.log('create', req.body);
      // var m = new model(req.body);
      // m.save(function (err) {
      //   if (!err) {
      //     res.send(m);
      //   } else {
      //     res.send(errMsg(err));
      //   }
      // });

      var m = req.article.todos.push({
        title:''
      });

      //console.log(req.article.todos[m-1].toJSON())



      req.article.save(function(err){
          if (!err) {
            res.send( req.article.todos[m-1].toJSON() );
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
      console.log('read!!');
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
      //console.log('delete', req.body);
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


  function loadParams(model) {
      return function(req, res, next, idt) {
          model.findOne({
              'todos._id': idt
          }, function(err, article) {
              if (err) return next(err)
              if (!article) return next(new Error('not found'))
                console.log(article,idt)
              var index
              article.todos.forEach(function(val, i) {
                console.log(String(val._id), idt,String(val._id)==idt, i)
                  if (String(val._id) === idt) {
                      index = i
                  }
              });

              if (index===undefined) {
                  res.send(500, errMsg('Item Does not Exist'))
              } else {
                  req.todoIndex = index;
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
    app.del(pathWithId, getDeleteController(model));
  };

}(exports));
