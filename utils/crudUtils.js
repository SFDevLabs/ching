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
      var result = req.article.todos? req.article.todos:[{title:'stuffy'}];
      res.send(result);
    };
  }

  //------------------------------
  // Create
  //
  function getCreateController(model) {
    return function (req, res) {
      //console.log('create', req.body);
      var m = new model(req.body);
      m.save(function (err) {
        if (!err) {
          res.send(m);
        } else {
          res.send(errMsg(err));
        }
      });
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
      //console.log('update', req.body);
      console.log(req.params)
      model.findById(req.params.idt, function (err, result) {

        if (result===null){
          res.send({'err':true, 'description':'no model'});
          return
        }
        var key;
        for (key in req.body) {
          result[key] = req.body[key];
        }
        result.save(function (err) {
          if (!err) {
            res.send(result);
          } else {
            res.send(errMsg(err));
          }
        });
      });
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

    // app.param('id', function(req, res, next, id){
    //   var User = mongoose.model('User')

    //   Article.load(id, function (err, article) {
    //     if (err) return next(err)
    //     if (!article) return next(new Error('not found'))
    //     req.article = article
    //     next()
    //   })

    // });

    path = '/articles/:id'
    pathWithId = path + '/list/:idt';

    console.log(pathWithId);
    app.get(path+'/list', getListController(model));
    app.post(path, getCreateController(model));
    app.get(pathWithId, getReadController(model));
    app.put(pathWithId, getUpdateController(model));
    app.del(pathWithId, getDeleteController(model));
  };

}(exports));
