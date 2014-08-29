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
          App.handsonContainer.handsontable("render");
    },
    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
      //if (todo.get('_noSave')!==true){
        todo.save(todo.toJSON());
      //}
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
      this.handsonObj = this.handsonContainer.data('handsontable')

      App.addy=[];
      this.handsonObj.addHook('beforePaste',function(input,cords){
            var y = cords[0],
                x = cords[1],
                y2 = cords[2],
                x2 = cords[3],
                lastRowIndex = App.handsonObj.countRows()-1,
                length = input.length,
                lastPasteRowIndex = (length-1)+y,
                overFlow = lastPasteRowIndex-lastRowIndex,
                pasteInput = input.slice(length-overFlow)
                var colhead = App.handsonObj.getColHeader().slice(x, (x2+1) )

                for (var i = pasteInput.length - 1; i >= 0; i--) {
                  var data = pasteInput[i],
                      obj={};
                  for (var y = data.length - 1; y >= 0; y--) {
                        if (colhead[y]){
                          
                          var schema = cars.schema[ colhead[y] ];

                          var typeObj = [Date, Number, String][ ['date', 'number', 'string'].indexOf(schema)]

                          obj[ colhead[y] ]=typeObj(data[y])
                        }
                  };
                  App.addy.push(obj);

                };            
      });
      
      // App.typeConvert = function(){
      //   [Date, Number, String][ ['date', 'number', 'string'].indexOf('string')]
      // }

      //App.handsonObj.getColHeader()

      this.handsonObj.addHook('afterChange',function(input,type){
        if (type==='undo'){
         // cars.pop();
        }else{
          cars.add(App.addy);
        }
        
      });

      // this.handsonObj.addHook('beforePaste',function(input,endIndex,type){

      //   var rows = this.countRows()
      //     , moreIndex = (endIndex.areaEnd.row+1)-rows
      //     , adder=[];
      //   for (var i = moreIndex - 1; i >= 0; i--) {
      //         adder.push({})
      //   }
      //   // 
      //   cars.add(adder)
      //   var deserve = $.Deferred()
      //   var cb = function(){
      //     cars.off('sync', cb);
      //     deserve.resolve();
      //   }
      //   cars.on('sync', cb);
      //   return deserve
      // })
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
        saveIt:function(todo, option){
          ///caluclate the total
          var cost = todo.get('cost'),
              cost = cost===""?0:cost,
              tax1 = todo.attributes.tax1==null?0:todo.attributes.tax1,
              tax2 = todo.attributes.tax2==null?0:todo.attributes.tax2,
              qty = !todo.attributes.qty?0:todo.attributes.qty,

              total;
              if ([cost, qty].indexOf(null)===-1){
                total = cost * (1+tax1) * (1+tax2) * qty
                todo.attributes.total=total;
              }
              
            ///and Save
            if (!option.unset && !option.xhr){//this makes sure we are not killing the model
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
    //cars.add({_blank:true});
    cars.add({cost:4});

  })
  $("#pop_car").click(function () {
    cars.pop();
  })


  App = new AppView();


//}(jQuery, _, Backbone));