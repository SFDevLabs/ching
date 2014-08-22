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

      cars.bind('remove', this.addOne, this);

      cars.bind('all', this.render, this);

      this.footer = this.$('footer');
      this.main = $('#main');

      cars.fetch();
    },
    remove: function () {
      $container.handsontable("render");
    },
    render: function () {
      this.setup();
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
      todo.save();
    },
    destroy: function(){
      todo.destroy();
    },
    handsonType:function(type){
      if (type==='string'){
        return 'text'
      } else if (type==='number'){
        return 'numeric'
      }
    },
    handsonContainer:$("#example1"),
    setup:function(){

      var first = cars.at(0)

      if (!first){return false;}

      var firstModelAttributes = first.attributes
        , columns=[]
        , colHeaders=[];
      for (var i in firstModelAttributes){
        if (i!=="_id"){
          var val=firstModelAttributes[i]
          colHeaders.push(i);
          columns.push(
            {
              data:setterFactor(i), 
              type:this.handsonType( cars.schema[i]),
              //format:this.handsonType( cars.format[i])
            }
          )
        }
      }
      //var mmm=['note','item']
      //var mm=[attr('note','text'),attr('item','text')]
      this.handsonContainer.handsontable({
        data: cars,
        dataSchema: function(){
          return new CarModel();
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
        },
        saveIt:function(a,b,c){
            this.save();
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
      return response.data
    }
    // colHead:['',''],
    // colData:[attr('note','text'),attr('item','text')]
  });

  var cars = new CarCollection();
  //debugger
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

  // normally, you'd get these from the server with .fetch()
  function attrObj(attr, type) {
    // this lets us remember `attr` for when when it is get/set
    var setter = function (car, value, format) {
      if (_.isUndefined(value)) {
        return car.get(attr);
      } 
      car.set(attr, value);
    } 
    
    return {data: setter, type:type, format: format};
  }


  // function makeCar() {
  //   return new CarModel();
  // }

  // use the "good" Collection methods to emulate Array.splice
  function hacked_splice(index, howMany /* model1, ... modelN */) {
    var args = _.toArray(arguments).slice(2).concat({at: index}),
      removed = this.models.slice(index, index + howMany);
    this.remove(removed).add.apply(this, args);
    return removed;
  }



  $("#add_car").click(function () {
    cars.add();
  })

  App = new AppView();


//}(jQuery, _, Backbone));