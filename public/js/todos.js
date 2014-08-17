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
      $container.handsontable("render");
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
      todo.save();
    },
    destroy: function(){
      todo.destroy();
    }

    // createOnEnter: function (e) {
    //   if (e.keyCode !== 13) { return; }
    //   if (!this.input.val()) { return; }

    //   Todos.create({title: 'stuff',done: false});
    //   this.input.val('');
    // },



  });

             var CarModel = Backbone.Model.extend({

                  idAttribute: "_id",
                  initialize: function(){

                    this.bind('change',this.saveIt);

                  },

                  defaults: {
                      "title":  "",
                      "done": false
                  },
                  saveIt:function(a,b,c){
                    if (typeof this.get('done') !== 'boolean'){
                      alert('bad type');
                    } else{
                      this.save();
                    }
                  }


             });

            var CarCollection = Backbone.Collection.extend({
              model: CarModel,
              // Backbone.Collection doesn't support `splice`, yet! Easy to add.
              splice: hacked_splice,

              url: function () {
                return '/articles/'+aId+'/list' + ((this.id) ? '/' + this.id : '');
              }
            });

            var cars = new CarCollection();


            var $container = $("#example1");
            $container.handsontable({
              data: cars,
              dataSchema: makeCar,
              contextMenu: true,
              columns: [
                attr('done', 'checkbox'),
                attr('title', 'text')
              ],
              colHeaders: ["done", "title"]
              //minSpareRows: 1 //see notes on the left for `minSpareRows`
            });


            // normally, you'd get these from the server with .fetch()
            function attr(attr, type) {
              // this lets us remember `attr` for when when it is get/set
              var setter = function (car, value) {
                if (_.isUndefined(value)) {
                  return car.get(attr);
                }
                car.set(attr, value);
              } 
              
              return {data: setter, type:type};
            }

            var setter = function (car, value) {
              if (_.isUndefined(value)) {
                return car.get(attr);
              }
              car.set(attr, value);
            } 

            function makeCar() {
              return new CarModel();
            }

            // use the "good" Collection methods to emulate Array.splice
            function hacked_splice(index, howMany /* model1, ... modelN */) {
              var args = _.toArray(arguments).slice(2).concat({at: index}),
                removed = this.models.slice(index, index + howMany);
              this.remove(removed).add.apply(this, args);
              return removed;
            }

            // show a log of events getting fired
            // function log_events(event, model) {
            //   var now = new Date();
            //   $("#example1_events").prepend(
            //       $("<option/>").text([
            //         ":", now.getSeconds(), ":", now.getMilliseconds(),
            //         "[" + event + "]",
            //         JSON.stringify(model)
            //       ].join(" "))
            //     )
            //     .scrollTop(0);
            // }

            $("#add_car").click(function () {
              cars.add();
            })

            App = new AppView();


//}(jQuery, _, Backbone));