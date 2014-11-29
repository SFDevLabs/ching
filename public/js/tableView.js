$(document).ready(function () {

    $( document ).ready(function() {
var keys = ["Love", "Maserati", "Mazda", "Mercedes", "Mini", "Mitsubishi"]
  // var values = [
  
  //   ["2009", 0, 2941, 4303, 354, 5814],
  //   ["2010", 5, 2905, 2867, 412, 5284],
  //   ["2011", 4, 2517, 4822, 552, 6127],
  //   ["2012", 2, 2422, 5399, 776, 4151]
  // ];
  // values=$('#csvdata').val();
  // debuggers
      var tableData = window.csvData?window.csvData:[];
      $('#preview').handsontable({
                    data: tableData
                    ,minSpareRows: 1
                    ,rowHeaders: true
                  });
    });

});

