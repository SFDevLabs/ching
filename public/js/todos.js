//$(function ($, _, Backbone) {

  "use strict";

  var AppView, App, aId=window.location.pathname.split('/')[2], tokenId=window.location.pathname.split('/')[4];;


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
      cars.bind('sync', this.renderAfterSync);
      cars.bind('remove', this.renderAfterSync);
      cars.bind('add', this.renderAfterSync);
      cars.bind('change reset fetch remove',this.totalCalculation)

      this.footer = this.$('footer');
      this.main = $('#main');
      this.total = $("#total .amount");

      this.timeZoneOffset=new Date().getTimezoneOffset()/60
      cars.fetch();

    },formatCurrency: function(num) {
        var p = num.toFixed(2).split(".");
        return "$" + p[0].split("").reverse().reduce(function(acc, num, i, orig) {
            return  num + (i && !(i % 3) ? "," : "") + acc;
        }, "") + "." + p[1];
      },
    totalCalculation: function(todo, response){
      if (!cars.length){
        var curr = App.formatCurrency(0);
        App.total.html(curr);
        return false
      };
      var total = cars.pluck('total').reduce(function(a,b){ 
        var A = (isNaN(a) || typeof a!=='number')?0:a
          , B = (isNaN(b) || typeof b!=='number')?0:b;
        return A+B;
      });
      total = total?App.formatCurrency(total):App.formatCurrency(0);
      App.total.html(total);
    },
    renderAfterSync: function (todos, response) {  
       App.handsonContainer.handsontable("render");//we need to maunaull rerender after we add an item.
    },
    // Add a single todo item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function (todo) {
       if (!App.disableSave){
          todo.save(todo.toJSON());
       } 
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
    handsonContainer:$("#grid"),
    pad:function pad (str, max) {
      str = str.toString();
      return str.length < max ? pad("0" + str, max) : str;
    },
    qtyRender: function(instance, td, row, col, prop, value, cellProperties){

      var type = cars.at(row).get('type');
      var valNumber = Number(value)
      if (type && type.toLowerCase()==='time' && value!==null && value!==undefined && !isNaN(valNumber)){//Null changing and checking for time formating
        cellProperties.valid=true;
        
        var totalSeconds = Number(valNumber)*3600;

        var hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        var minutes = Math.floor(totalSeconds / 60);
        //var seconds = totalSeconds % 60;

        arguments[5] = App.pad(hours,2)+'h '+App.pad(minutes,2)+'m'
        // if (seconds>0){
        //    arguments[5]+=( ':'+App.pad(seconds,2) );
        // }
        Handsontable.renderers.TextRenderer.apply(this, arguments);
      } else{
        Handsontable.renderers.NumericRenderer.apply(this, arguments);
      }

    },
    setup:function(){
      cars.unbind('reset', this.setup, this);///we only need to fire setup once;
      this.setupFlag=true;
      var columns=[]
          , colHeaders=[]
          , colWidth=[]
          , colPos = cars.columnPosition;
      for (var i in colPos){
        if (i!=="_id"){
          var pos = colPos[i];
          colHeaders[pos] = cars.displayName[i];
          if (cars.format[i]==='dropdown'){
            columns[pos] =
            {
                data:setterFactor(i) 
              , type:cars.format[i]
              , source: cars.dropdownOptions[i]
            }
          }else if (cars.format[i]=='buttons'){
              App.buttonIndex=colPos[i];
              columns[pos]={
                  data:function(){return '<a class="grid-buttons add" href="javascript:void(0)"><i class="typcn typcn-plus"></i></a><a class="grid-buttons delete" href="javascript:void(0)"><i class="typcn typcn-delete-outline"></i></a>'}//setterFactor(i)
                  , type:this.handsonType( cars.schema[i])
                  , format:cars.format[i]
                  , dateFormat:cars.format[i]
                  //, source: cars.dropdownOptions[i]
                  , renderer:'html'
                  , readOnly: true
                }
          }else{
              columns[pos]={
                  data:setterFactor(i)
                  , type:this.handsonType( cars.schema[i])
                  , format:cars.format[i]
                  , dateFormat:cars.format[i]
                  //, source: cars.dropdownOptions[i]
                }
          }
          if(i==='total'){columns[pos].readOnly=true};
        colWidth[pos]=cars.colWidth[i]
        }
      }

      Handsontable.renderers.registerRenderer('qtyRender', this.qtyRender); //maps function to lookup string

      this.handsonContainer.handsontable({
        data: cars,
        dataSchema: function(){
          return new CarModel();
        },
        cells:function (row, col, prop) {
          var opt;
          if (cars.columnPosition.qty===col){
            opt = {
             renderer:'qtyRender'
            }
          } else{
            opt = {};
          }
          return opt;
        },
        contextMenu: true,
        columns: columns,
        colHeaders: colHeaders,
        rowHeaders: true,
        colWidths: colWidth,//[180, 100, 160, 160, 80, 80, 80, 180, 100],  //TODO add to api
        manualColumnResize: true
        //minSpareRows: 1 //see notes on the left for `minSpareRows`
      });
      this.handsonObj = this.handsonContainer.data('handsontable')
      this.handsonObj.contextMenu.disable();//get rid of the context meu

      this.handsonObj.addHook('beforePaste',function(input, cords, type){
            var y = cords[0],
                x = cords[1],
                y2 = cords[2],
                x2 = cords[3],
                lastRowIndex = App.handsonObj.countRows()-1,
                length = input.length,                
                lastPasteRowIndex = (length-1)+y,
                overFlow = lastPasteRowIndex-lastRowIndex,
                addList=[],
                defferObjFlag = true;
             if (overFlow>0){
               for (var i = overFlow - 1; i >= 0; i--) {
                  addList.push({});
                };
                App.disableSave=true; ///Turn off saving so we can save in a batch on "afterChange"
                cars.add(addList);
                App.handsonContainer.handsontable("render");
             }

      });
      this.handsonObj.addHook('beforeChange',function(input, type){
        if (input.length>1){ ///Are we chaning more than 1 item.  Lets do it in a batch
          App.disableSave=true;
        }
      });
      this.handsonObj.addHook('beforeAutofill',function(input, type){
          if(window.keenClient){
            keenClient.addEvent("user_event",{
                type:'autofill'
              , page: '/article/:id'
              , user:analyticsConstance.uId
              , session:analyticsConstance.sId
            });
          }  
      });
      this.handsonObj.addHook('afterSelectionEnd',function(y1, x1, y2, x2){
          if(window.keenClient && (x1!==x2 || y1!==y2)){
            keenClient.addEvent("user_event",{
                type:'grid_selection'
              , selection: {y1:y1, x1:x1, y2:y2, x2:x2}
              , multiple: true
              , page: '/article/:id'
              , user:analyticsConstance.uId
              , session:analyticsConstance.sId
            });
          } 

      });
      this.handsonObj.addHook('afterSelection',function(y1, x1, y2, x2){ //this prevents us from selecting the buttons row. Hard coded to 9;        
        var index=App.buttonIndex;
        if (x1===index || x2===index){
            if (x1===index){x1=index-1};
            if (x2===index){x2=index-1};
            App.handsonObj.selectCell(y1, x1, y2, x2);
        }
      });

      this.handsonObj.addHook('afterSelection',function(y1, x1, y2, x2){
        var index=App.buttonIndex;
        if (x1===index || x2===index){
            var clickedTag = $(event.target).closest('a')
            if(clickedTag.length!==0 && clickedTag.hasClass('delete')){
              var r = confirm("Please confirm.\nThis permanently delete this row.")
              if (r){
                cars.remove(cars.at(y1));
              }
              App.handsonObj.deselectCell()//We are interpecting the script so we need to deselect and kill the class.

            } else if (clickedTag.length!==0 && clickedTag.hasClass('add')){
              $.post(aId+'/api/add',{index:y1});
              cars.fetch();
            }
        }
      });
      

      this.handsonObj.addHook('afterChange',function(input, type){
        if (App.disableSave){
          cars.each(function(model){
            model.validate(model.attributes,{modelSet:model});
          });
          cars.sync();
          App.disableSave=false;
        }
      });


      this.scrollPasteHack();

      this.handsonObj.addHook('afterSelection',function(x1, y1){//This sets the selected row buttons to visible.
        $('#grid tbody td.visible').removeClass('visible');
        $(App.handsonObj.getCell(x1,y1)).siblings(':last').addClass('visible')
      })
      this.handsonObj.addHook('afterDeselect',function(a, b, c){
        $('#grid tbody td.visible').removeClass('visible');
      })

    },
    tableResize: function(){//enneded now but this is a clever way to remove col and make the grid resize dynamically
      App.handsonObj.manualColumnWidths=[1000,200];
      App.handsonObj.render();
    },
    //scrollPasteHack Found at: http://stackoverflow.com/questions/24593357/handsontable-disable-auto-scroll-up-when-pasting-into-a-cell
    scrollPasteHack:function(){
           var position_Y_before = null
             , position_X_before = null;
      App.handsonObj.addHook('beforeKeyDown',function(e) {
              position_Y_before = window.pageYOffset || 0;
              position_X_before = window.pageXOffset || 0;
          });
      //Here we prevent from scrolling to top of page after pasting to handsontable with cmd+v or ctrl+v
      $(window).scroll(function(){
          if(position_Y_before != null){
              window.scrollTo(position_X_before, position_Y_before);
              position_Y_before = null;
              position_X_before = null;
          }
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
          this.on('change:tax1',this.tax1Formater);
          this.on('change:tax2',this.tax2Formater);
          this.on('change:qty',this.qtyFormater);
        },
        tax1Formater:function(todo,val){
            if (typeof val === 'number'){
              todo.attributes.tax1 = val/100;//Set the tax attr from the above calculation
            }
        },
        tax2Formater:function(todo,val){
            if (typeof val === 'number'){
              todo.attributes.tax2 = val/100;//Set the tax attr from the above calculation
            }
        },
        qtyFormater:function(todo,val){
            if (isNaN(Number(val)) && typeof val === 'string' && val.search(':')!==-1){
              var vals = val.split(':'),
                  hour = vals[1]?Number(vals[0]):0,
                  min = vals[1]?Number(vals[1]):0,
                  sec = vals[2]?Number(vals[2]):0,
                  number = hour+(min/60)+(sec/3600);
              todo.set('qty', number);//Set the tax attr from the above calculation
              todo.set('type', 'Time');
            }
        },
        saveIt:function(todo, option){
          ///caluclate the total
          var cost = todo.get('cost'),
              cost = cost===""?0:cost,
              tax1 = todo.attributes.tax1==null?0:todo.attributes.tax1,
              tax2 = todo.attributes.tax2==null?0:todo.attributes.tax2,
              qty = !todo.attributes.qty?0:todo.attributes.qty,
              total;

              if ([cost, qty].indexOf(null)===-1 && [cost, qty].indexOf(undefined) && ![cost, qty].some(function(a){ return isNaN(a)})){
                total = cost * (1+tax1) * (1+tax2) * qty
                todo.attributes.total=total;
              }else{
                todo.attributes.total=null;
              }
              
            ///and Save
            if (!option.unset && !option.xhr && !App.disableSave){//this makes sure we are not killing the model
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
            } else if (val === ""){//Empty Value from handsontable set to null.  Look for null hcking thoughout the app
              attrs[i]===null;
              if (options.modelSet){options.modelSet.set(i,null)}
            }else if (schema!==typeof val){ //Check the type agains the schema API from the parse API stored in the BB collection.
              return "Not a valid "+schema+'. Please enter a '+schema;
            }
          }
        },
        parse:function(response){
          if (response && response.date!==null){
            response.date = this.addHoursToDate(response.date, App.timeZoneOffset)//Add the timezone offset so we always get a cannonical date of the invoice
          }
          return response;
        },
        addHoursToDate:function(date, hours) {
            date = new Date(date);// conver ttot date object from string
            return new Date(date.getTime() + hours*3600000);
        }
   });

  var CarCollection = Backbone.Collection.extend({
    model: CarModel,
    // Backbone.Collection doesn't support `splice`, yet! Easy to add.
    splice: hacked_splice,

    url: function () {
      var base = '/articles/'+aId+'/api'; //globally defined
      base += (this.id) ? '/' + this.id : '';//this.id will only exist ifwe are updating a model;
      base += (tokenId) ? '/token/' + tokenId : '';
      return   base;
    },
    parse : function(response){
      this.schema=response.schema;
      this.format=response.format;
      this.dropdownOptions=response.dropdownOptions;
      this.columnPosition=response.columnPosition;
      this.displayName=response.displayName;
      this.colWidth=response.colWidth
      return response.data
    },
    sync:function(a,b,c){  //This makes sure we only update when we need to
      if (a==='read')
        Backbone.sync('read',this, c)
      else{
        Backbone.sync('update',this, c)
      }
    }

  });

  var cars = new CarCollection();

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

  // use the "good" Collection methods to emulate Array.splice
  function hacked_splice(index, howMany /* model1, ... modelN */) {
    var args = _.toArray(arguments).slice(2).concat({at: index}),
      removed = this.models.slice(index, index + howMany);
    this.remove(removed).add.apply(this, args);
    return removed;
  }



  $("#add_car_time").click(function () {
    cars.add({type:'Time'});

  })
  $("#add_car_item").click(function () {
    cars.add({type:'Item'});

  })
  $("#pop_car").click(function () {
    cars.pop();
  })


  App = new AppView();







$('.dropzone').on('dragenter',function(e){
  $(this).addClass('dragging');
  $(this).closest('.dropzone').addClass('dragging');

  $(this).delay(2000).queue(function(next){
    $(this).removeClass('dragging');
    next();
  });
});
$('.dropzone').on('drop',function(e){
  $(this).removeClass('dragging');
});

$('#destroyPreview').on('click', function(e){  //this is depricated.
  $('#preview').data('handsontable').destroy();
});

// ///copy paste info box//this is depricated.
// $(window).on('cut', function(e){
//   if (App.handsonObj.getSelected()){
//       alert('Use Command & x to cut a cell');
//   }
// });
// $(window).on('copy', function(e){//this is depricated.
//   if (App.handsonObj.getSelected()){
//       alert('Use Command & c to copy a cell');
//   }
// });
// $(window).on('paste', function(e){//this is depricated.
//   if (App.handsonObj.getSelected()){
//       alert('Use Command & p to paste into the grid');
//   }
// });
// 
var post = function(){
  $.ajax({
    type: "POST",
    url: aId+'/upload',
    data: {
      csv:$('#csv-ajax').val()
    },
    success: function(result, xhr, jqxhr){
        renderCSV( result.data, result.status)
    },
    dataType: 'json'
  });
  $('#csv-ajax').val('');
}

$('#fileuploadcsv').fileupload({
        url: aId+'/upload'
        ,dataType: 'json'
        ,autoUpload: true
        ,dropZone: $('#dropzone')
      //  acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        ,maxFileSize: 20000000 // 5 MB
        // Enable image resizing, except for Android and Opera,
        // which actually support image resizing, but fail to
        // send Blob objects via XHR requests:
        ,disableImageResize: /Android(?!.*Chrome)|Opera/
            .test(window.navigator.userAgent)
        ,previewMaxWidth: 100
        ,previewMaxHeight: 100
        ,previewCrop: true
    })
    .on('fileuploaddone', function (e, data) {
        renderCSV( data.result.data, data.result.status)
     });


var renderCSV = function(data, status){
        if (!data.length){
          return false
        };

        if (status!=='raw_data'){//
                  cars.fetch();
            } 
        else { 
                
        var  keys = _.keys(data[0])//get an array of keys
            , values = _.map(data,function(val){ return _.values(val) })  //flatten the array of data to an array of arrays
            , csvButtonArea = 
              
            values.unshift(keys) //add the keys to the front of the top array
            var json = JSON.stringify(values); //make the jason

            if (json){
              $('.csv-open-table-window input.data').val(json);
              $('.csv-open-table-window').addClass('visible');
            };
            //
                // $('#preview').handsontable({
                //   data: values
                //   ,minSpareRows: 1
                //   ,colHeaders: keys
                //   ,columnSorting: true
                // });
          }
}

$('#fileuploadimage').fileupload({
        url: aId+'/uploadimage'
        ,dataType: 'json'
        ,autoUpload: true
        ,dropZone: $('#dropzoneimage')
      //  acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
        ,maxFileSize: 20000000 // 5 MB
        // Enable image resizing, except for Android and Opera,
        // which actually support image resizing, but fail to
        // send Blob objects via XHR requests:
        ,disableImageResize: /Android(?!.*Chrome)|Opera/
            .test(window.navigator.userAgent)
        ,previewMaxWidth: 100
        ,previewMaxHeight: 100
        ,previewCrop: true
    }).on('fileuploaddone', function (e, data) {
        
          
        //This is totally hack logic duplicated in show to render the photos you upload to the site.
        $('.images-grid').html('')
        data.result.forEach(function(val,i){
          var imgthumb = $('<img>').attr('src',val.cdnUri+'/thumb_'+val.file);
          var image = $('<a class="image">')
              .attr('data-src',val.cdnUri+'/detail_'+val.file)
              .attr('href','javascript:void(0)')
              .append(imgthumb)
          $('.images-grid')
            .prepend(image);

          if (val.itemReference){
            var b=cars.findWhere({_id:val.itemReference})
            if (b)
              $('.images-grid').prepend(b.get('item'));
          }          
        })
     });

///turn on date picker
$('.date').datepicker();
$("abbr.timeago").timeago();



// var swap=function(x,y){
//   var m =$('#example').data('handsontable')
//   //     ,colOneData = m.getDataAtCol(colOne)
//   //     ,colTwoData = m.getDataAtCol(colTwo)
  
//   // for (var i = colOneData.length - 1; i >= 0; i--) {    
//   //   m.setDataAtCell(i,colTwo,colOneData[i])
//   // };
//   // for (var i = colTwoData.length - 1; i >= 0; i--) {    
//   //   m.setDataAtCell(i,colOne,colTwoData[i])
//   // };

//   var data = m.getData()
//       ,newData = data.map(function(list){
//         var b = list[y];
//             list[y] = list[x];
//             list[x] = b;
//           return list
//       });
//   m.loadData(newData);


// }

// var rerender = function(){
//   var m =$('#example').data('handsontable')
  
//    var values = m.getData()
//    m.destroy();
//           $('#example').handsontable({
//           data: values
//           ,minSpareRows: 1
//           ,colHeaders: App.handsonObj.getColHeader()
//           ,colWidths: [180, 100, 160, 160, 80, 80, 80, 80, 180]
//           ,columnSorting: true
//         });


// }

// var addAll = function(){

//   var data = $('#example').data('handsontable').getData()
//       , headers = App.handsonObj.getColHeader();

//   var addData = data.map(function(val, i){
//     var obj={};
//     headers.forEach(function(headerVal,i){
//       return obj[headerVal]=val[i]
//     });
//     return obj;
//   });
//   cars.add(addData)
// }
// 


//}(jQuery, _, Backbone));