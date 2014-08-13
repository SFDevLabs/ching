//$(function ($, _, Backbone) {

  //"use strict";

  var Todo, TodoList, Todos, TodoView, AppView, App;

  // Todo Model
  // ----------

  // Our basic **Todo** model has `title`, `order`, and `done` attributes.
  Todo = Backbone.Model.extend({

    // MongoDB uses _id as default primary key
   // idAttribute: "_id",

    // //Default attributes for the todo item.
    // defaults: function () {
    //   return {
    //     title: "empty todo...",
    //     order: Todos.nextOrder(),
    //     done: false
    //   };
    // },

    // // Ensure that each todo created has `title`.
    // initialize: function () {
    //   if (!this.get("title")) {
    //     this.set({"title": this.defaults.title});
    //   }
    // },

    // // Toggle the `done` state of this todo item.
    // toggle: function () {
    //   this.save({done: !this.get("done")});
    // },

    // // Remove this Todo and delete its view.
    clear: function () {
      this.destroy();
    }

  });

  // Todo Collection
  // ---------------

  TodoList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Todo,

    // Returns the relative URL where the model's resource would be
    // located on the server. If your models are located somewhere else,
    // override this method with the correct logic. Generates URLs of the
    // form: "/[collection.url]/[id]", falling back to "/[urlRoot]/id" if
    // the model is not part of a collection.
    // Note that url may also be defined as a function.
    url: function () {
      return "/todo" + ((this.id) ? '/' + this.id : '');
    },

    // Filter down the list of all todo items that are finished.
    // done: function () {
    //   return this.filter(function (todo) { return todo.get('done'); });
    // },

    // Filter down the list to only todo items that are still not finished.
    // remaining: function () {
    //   return this.without.apply(this, this.done());
    // },

    // // We keep the Todos in sequential order, despite being saved by unordered
    // // GUID in the database. This generates the next order number for new items.
    // nextOrder: function () {
    //   if (!this.length) { return 1; }
    //   return this.last().get('order') + 1;
    // },

    // // Todos are sorted by their original insertion order.
    // comparator: function (todo) {
    //   return todo.get('order');
    // }

  });

  // Create our global collection of **Todos**.
  Todos = new TodoList();

  // Todo Item View
  // --------------

  // The DOM element for a todo item...
  TodoView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The TodoView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Todo** and a **TodoView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function () {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the titles of the todo item.
    render: function () {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.toggleClass('done', this.model.get('done'));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function () {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function () {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the todo.
    close: function () {
      var value = this.input.val();
      if (!value) {
        this.clear();
      }
      this.model.save({title: value});
      this.$el.removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function (e) {
      if (e.keyCode === 13) {
        this.close();
      }
    },

    // Remove the item, destroy the model.
    clear: function () {
      this.model.clear();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#todoapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-todo":  "createOnEnter",
    },

    // At initialization we bind to the relevant events on the `Todos`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting todos.
    initialize: function () {

      this.input = this.$("#new-todo");
      this.allCheckbox = this.$("#toggle-all")[0];

      cars.bind('add', this.addOne, this);

      cars.bind('remove', this.addOne, this);

      cars.bind('reset', this.addAll, this);
      cars.bind('all', this.render, this);


      // cars.on("all", log_events)
      //         .on("add", function () {
      //           $container.handsontable("render");
      //         })
      //         .on("remove", function () {
      //           $container.handsontable("render");
      //         });

      this.footer = this.$('footer');
      this.main = $('#main');

      cars.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    // 
    remove: function () {
      $container.handsontable("render");
    },
    render: function () {
      // var done = Todos.done().length,
      //   remaining = Todos.remaining().length;
      $container.handsontable("render");
      // if (Todos.length) {
      //   this.main.show();
      //   this.footer.show();
      //   //this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
      // } else {
      //   this.main.hide();
      //   this.footer.hide();
      // }

      //this.allCheckbox.checked = !remaining;
    },

    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
      //var view = new TodoView({model: todo});
      //$("#todo-list").append(view.render().el);
    },

    // Add all items in the **Todos** collection at once.
    addAll: function () {
      Todos.each(this.addOne);
    },

    // If you hit return in the main input field, create new **Todo** model
    createOnEnter: function (e) {
      if (e.keyCode !== 13) { return; }
      if (!this.input.val()) { return; }

      Todos.create({title: 'stuff',done: false});
      this.input.val('');
    },



  });

  // Finally, we kick things off by creating the **App**.
  //debugger
  //Todos.fetch();

  ///
  ///
             var CarModel = Backbone.Model.extend({

                  idAttribute: "_id",
                  initialize: function(){

                    this.bind('change',this.saveIt);

                  },
                  saveIt:function(a,b,c){
                    this.save()

                  }


             });

            var CarCollection = Backbone.Collection.extend({
              model: CarModel,
              // Backbone.Collection doesn't support `splice`, yet! Easy to add.
              splice: hacked_splice,

              url: function () {
                return "/todo" + ((this.id) ? '/' + this.id : '');
              }
            });

            var cars = new CarCollection();



            // since we're not using a server... make up some data. This will make
            // a couple CarModels from these plain old objects
            // cars.add([
            //   {make: "Dodge", model: "Ram", year: 2012, weight: 6811},
            //   {make: "Toyota", model: "Camry", year: 2012, weight: 3190},
            //   {make: "Smart", model: "Fortwo", year: 2012, weight: 1808}
            // ]);

            var $container = $("#example1");
            $container.handsontable({
              data: cars,
              dataSchema: makeCar,
              contextMenu: true,
              columns: [
                attr("done"),
                attr("title")
              ],
              colHeaders: ["done", "title"]
              //minSpareRows: 1 //see notes on the left for `minSpareRows`
            });

            // this will log all the Backbone events getting fired!
            

            // you'll have to make something like these until there is a better
            // way to use the string notation, i.e. "bb:make"!

            // normally, you'd get these from the server with .fetch()
            function attr(attr) {
              // this lets us remember `attr` for when when it is get/set
              return {data: function (car, value) {
                if (_.isUndefined(value)) {
                  return car.get(attr);
                }
                car.set(attr, value);
              }};
            }

            // just setting `dataSchema: CarModel` would be great, but it is non-
            // trivial to detect constructors...
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
            function log_events(event, model) {
              var now = new Date();
              $("#example1_events").prepend(
                  $("<option/>").text([
                    ":", now.getSeconds(), ":", now.getMilliseconds(),
                    "[" + event + "]",
                    JSON.stringify(model)
                  ].join(" "))
                )
                .scrollTop(0);
            }

            $("#add_car").click(function () {
              cars.add({make: "Tesla", model: "S", year: 2012, weight: 4647.3});
            })

            App = new AppView();


//}(jQuery, _, Backbone));