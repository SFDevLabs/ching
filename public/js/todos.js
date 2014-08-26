//$(function ($, _, Backbone) {

  "use strict";

  var AppView, App, aId=window.location.pathname.split('/')[2];


  AppView = Backbone.View.extend({
    el: $("#todoapp"),
    
    // Delegated events for creating new items, and clearing completed ones.
    events: {
     // "keypress #new-todo":  "createOnEnter",
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos.
    initialize: function () {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      cars.bind('add', this.addOne, this);

      cars.bind('remove', this.removeOne, this);

      cars.bind('reset', this.setup, this);

      cars.bind('sync', this.renderAfterSync, this);

      this.footer = this.$('footer');
      this.main = $('#main');

      cars.fetch();
    },
    renderAfterSync: function (todos, response) {
        if (todos.get('_blank')){///detect is this is a collection
          App.handsonContainer.handsontable("render");
        }
    },
    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
        todo.save();
    },
    removeOne: function (todo) {
      todo.destroy();
      this.handsonContainer.handsontable("render");
    },
    destroy: function(){
      todo.destroy();
    },
    handsonType:function(type){
      if (type==='string'){
        return 'text'
      } else if (type==='number'){
        return 'numeric'
      } else if (type==='date'){
          return 'date'
      }
    },
    handsonContainer:$("#example1"),
    blankRender: function(instance, td, row, col, prop, value, cellProperties){
      Handsontable.renderers.TextRenderer.apply(this, arguments);
    },
    setup:function(){

        var columns=[]
          , colHeaders=[],
            colPos = cars.columnPosition;
      for (var i in colPos){
        if (i!=="_id"){
          var pos = colPos[i]
          colHeaders[pos] = i
          columns[pos] =
            {
              data:setterFactor(i), 
              type:this.handsonType( cars.schema[i]),
              format:cars.format[i],
              dateFormat:cars.format[i]
            }
        }
      }

      Handsontable.renderers.registerRenderer('blank', this.blankRender); //maps function to lookup string

      this.handsonContainer.handsontable({
        data: cars,
        dataSchema: function(){
          return new CarModel();
        },
        cells:function (row, col, prop) {
          return {
            //renderer:'blank'
          }
        },
        contextMenu: true,
        columns: columns,
        colHeaders: colHeaders
        //minSpareRows: 1 //see notes on the left for `minSpareRows`
      });
    }

  });

   var CarModel = Backbone.Model.extend({

        idAttribute: "_id",
        initialize: function(){       
          this.bind('change',this.saveIt);
          this.on("invalid", function(model, error) {
            console.log(error);
          });
        },
        saveIt:function(todo,option){
            if (!option.unset){
              todo.save();
            }
        },
        validate:function(attrs, options){
          for (var i in attrs){
            var schema = cars.schema[i],  //Stored BB collection
                val    = attrs[i];
            if (!schema || val===null){
              //do nothing no schema
            } else if (schema==='date'){// Nested logic.  First we see if it is a date.
              if (val!=='' && val!==null && isNaN(new Date(val).getTime())){return "Not a valid Date"};  //Then we check if the ISO date string is valid
            } else if (schema!==typeof val){ //Check the type agains the schema API from the parse API stored in the BB collection.
              return "Not a valid "+schema+'. Please enter a '+schema;
            }
          }

        }


   });

  var CarCollection = Backbone.Collection.extend({
    model: CarModel,
    // Backbone.Collection doesn't support `splice`, yet! Easy to add.
    splice: hacked_splice,

    url: function () {
      return '/articles/'+aId+'/list' + ((this.id) ? '/' + this.id : '');
    },
    parse : function(response){
      this.schema=response.schema;
      this.format=response.format;
      this.columnPosition=response.columnPosition;
      return response.data
    }
    // colHead:['',''],
    // colData:[attr('note','text'),attr('item','text')]
  });

  var cars = new CarCollection();
  // cars.colData=[   ];
  // cars.colHead = ['note','item'];
  // 

var setterFactor=function(attr){
    var setter = function (car, value, format) {
      if (_.isUndefined(value)) {
        return car.get(attr);
      } 
      return car.set(attr, value);
    } 
    return setter
}
    var setter = function (car, value, format) {
      if (_.isUndefined(value)) {
        return car.get(attr);
      } 
      return car.set(attr, value);
    } 

  // // normally, you'd get these from the server with .fetch()
  // function attrObj(attr, type) {
  //   // this lets us remember `attr` for when when it is get/set
  //   var setter = function (car, value, format) {
  //     if (_.isUndefined(value)) {
  //       return car.get(attr);
  //     } 
  //     car.set(attr, value);
  //   } 
    
  //   return {data: setter, type:type, format: format};
  // }

  // use the "good" Collection methods to emulate Array.splice
  function hacked_splice(index, howMany /* model1, ... modelN */) {
    var args = _.toArray(arguments).slice(2).concat({at: index}),
      removed = this.models.slice(index, index + howMany);
    this.remove(removed).add.apply(this, args);
    return removed;
  }



  $("#add_car").click(function () {
    cars.add({_blank:true});
  })
  $("#pop_car").click(function () {
    cars.pop();
  })


  App = new AppView();


//}(jQuery, _, Backbone));