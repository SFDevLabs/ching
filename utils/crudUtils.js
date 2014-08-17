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

  //------------------------------
  // List
  //
  function getListController(articleModel) {
    return function (req, res) {
      // console.log('list', req.article._id);
      // articleModel.find({_id:}, function (err, result) {
      //   if (!err) {
      //     res.send(result);
      //   } else {
      //     res.send(errMsg(err));
      //   }
      // });
      // 
      var result = req.article.todos
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
            res.send(errMsg(err));
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
          res.send(errMsg(err));
        }
      });
    };
  }

  //------------------------------
  // Update
  //
  function getUpdateController(model) {
    return function (req, res) {

      

      var key;
      for (key in req.body) {
        if (key!=='_id'){
          req.article.todos[req.todo][key] = req.body[key];
        }
      }



      req.article.save(function(err){
          if (!err) {
            res.send( req.article.todos[req.todo].toJSON() );
          } else {
            res.send(errMsg(err));
          }
      })

      
      // model.findById(req.params.idt, function (err, result) {

      //   if (result===null){
      //     res.send({'err':true, 'description':'no model'});
      //     return
      //   }
      //   var key;
      //   for (key in req.body) {
      //     result[key] = req.body[key];
      //   }
      //   result.save(function (err) {
      //     if (!err) {
      //       res.send(result);
      //     } else {
      //       res.send(errMsg(err));
      //     }
      //   });
      // });
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

  exports.initRoutesForModel = function (app) {
    var model = Article,
      path,
      pathWithId;

    if (!app || !model) {
      return;
    }

    app.param('idt', function(req, res, next, idt){
    //console.log(idt)   
      model.findOne({'todos._id':idt},function (err, article){
          if (err) return next(err)
          if (!article) return next(new Error('not found'))

          var index
          var todo = article.todos.forEach(function(val,i){
            if (String(val._id)===idt){
              index=i
            }
          });
          req.todo=index;
          next()
        })
    });

    path = '/articles/:id'
    pathWithId = path + '/list/:idt';

    app.get(path+'/list', getListController(model));
    app.post(path+'/list', getCreateController(model));
    app.get(pathWithId, getReadController(model));
    app.put(pathWithId, getUpdateController(model));
    app.del(pathWithId, getDeleteController(model));
  };

}(exports));
