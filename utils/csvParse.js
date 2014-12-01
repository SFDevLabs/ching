
  
  var utils = require('../lib/utils')
    , _ = require("underscore")
    , serviceList = {  
             dingKey : [ 'Date', 'Time', 'Project', 'User', 'Comment' ]
            ,expensifyKey : [ 'Timestamp', 'Merchant', 'Amount', 'MCC', 'Category', 'Tag', 'Comment', 'Reimbursable', 'Original Currency', 'Original Amount', 'Receipt' ]
            ,freshbooksTime : ["Task name","Client name","Invoice","Invoice Date","Rate","Hours","Discount","Line Cost","Currency" ]
            ,freshbooksExpense : ["Date","Category","Vendor","Client","Author","Project","Notes","Amount","Bank Name","Bank Account"]
            ,paymo : ["Project","Task List","Task","User","Start Time","End Time","Notes","Hours"]
            ,shoebox : ["Date","Store","Note","Total (USD)", "Tax (USD)","Payment Type","Category","Receipt"]
            ,harvest : ["Date","Client","Project","Project Code","Task","Notes","Hours","Billable?","Invoiced?","First Name","Last Name","Department","Employee?","Hourly Rate","Billable Amount","Currency"]
            ,toggl : ["User","Email","Client","Project","Task","Description","Billable","Start date","Start time","End date","End time","Duration","Tags","Amount ()"]
            ,pivotal : ["Date","Last Name","Given Name","Person ID","Project","Hours","Description"]
            // ,timeeye : ["entryDate","userId","userName","projectId","projectName","taskId","taskName","notes","billed","minutes","expenses"]
            // ,timeeye : ["projectId","projectName","fixedAmount","hourlyRate","billableMinutes","billableTimeAmount","billableExpenses","totalMinutes","totalExpenses"]
            ,freckle : ["Date","Person","Group/Client","Project","Minutes","Hours","Tags","Description","Billable","Invoiced","Invoice Reference","Paid"]
            ,bigtime : ["Job","Staff Member","Category","Date","Input","N/C","Notes"]
            ,tsheets : ["username","payroll_id","fname","lname","number","group","local_date","local_day","local_start_time","local_end_time","tz","hours","jobcode","location","notes","approved_status"]
            ,tsheets_2 : ["username","payroll_id","fname","lname","number","group","local_date","local_day","local_start_time","local_end_time","tz","hours","jobcode","location","notes"]
      }
    , serviceListKeys=_.keys(serviceList);

  //this is a dupliced funcyion.  Consolidate it!
  var parseTimeQuantity = function(val){
    if (isNaN(Number(val)) && typeof val === 'string' && val.search(':')!==-1)
      {var vals = val.split(':'),
           hour = vals[1]?Number(vals[0]):0,
           min = vals[1]?Number(vals[1]):0,
           sec = vals[2]?Number(vals[2]):0,
           number = hour+(min/60)+(sec/3600);
        return number;} 
    else {return 0;}
    
  }

  exports.parseRules = function(keys){
        var rule
          , tsheet = function(val){
              return {
                    date: val.local_date?new Date(val.local_date.split('-')):null
                  , qty : val.hours?Number(val.hours):null
                  , item : (val.username?val.username:'')+' - '+(val.lname?val.lname:'')+', '+(val.fname?val.fname:'')
                  , type : 'Time'
              }
            };

        //Find the Keys
        var key = null;
        serviceListKeys.some(function(val, i){//This logic only finds the matching keys var
          var test = _.isEqual(serviceList[val], keys);
          key = test?val:null;
          return test
        });
        //This contains the facotrs whuch parse the json returned from CSV.
        switch (key) {
          case "dingKey":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Time?parseTimeQuantity(val.Time):null
                  , item : val.User?val.User:''+' - '+val.Project?val.Project:''
                  , note : val.Comment?val.Comment:null
                  , type : 'Time'
              }
            }
            break;
          case "tsheets":
            rule=tsheet
            break;
          case "tsheets_2":
            return tsheet;
            break;
          case "bigtime":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Input?Number(val.Input):null
                  , item : val['Staff Member']?val['Staff Member']:null
                  , type : 'Time'
                  , note : (val.Job?val.Job:'')+' - '+(val.Category?val.Category:'')
              }
            }
            break;
          case "expensifyKey":
            rule=function(val){
              return {
                    date: val.Timestamp?new Date(val.Timestamp.split('-')):null
                  , cost : val.Amount && !isNaN(Number(val.Amount))?Number(val.Amount):null
                  , qty : 1
                  , item : val.Merchant?val.Merchant:''
                  , type : 'Item'
                  , note : (val.Comment?val.Comment:'')+' - '+(val['']?val.Tag:'')+' - '+(val['Original Currency']?val['Original Currency']:'')
                  , total : (val.Amount)? val.Amount:null
              }
            }
            break;
          case "shoebox":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , cost : val['Total (USD)'] && !isNaN(Number(val['Total (USD)']))?Number(val['Total (USD)']):null
                  , qty : 1
                  , tax1: val['Tax (USD)'] && !isNaN(Number(val['Tax (USD)']))?Number(val['Tax (USD)']):null
                  , item : val.Store?val.Store:''
                  , type : 'Item'
                  , note : (val.Note?val.Note:'')+' - '+(val['Payment Type']?val['Payment Type']:'')+' - '+(val.Category?val.Category:'')
                  , total : (val['Total (USD)'])? val['Total (USD)']:null

              }
            }
            break;
          case "paymo":
            rule=function(val){
              return {
                    date: ( val['Start Time'] && val['Start Time'].slice(0,10) )?new Date(val['Start Time'].slice(0,10).split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : val.User?val.User:''
                  , type : 'Time'
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Project?val.Project:'')+' - '+(val['Task List']?val['Task List']:'')+' - '+(val.Task?val.Task:'')
              }
            }
            break;
          case "freckle":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Hours?val.Hours:null
                  , item : val.Person?val.Person:''
                  , type : 'Time'
                  , note : (val.Description?val.Description:'')+' - '+(val.Project?val.Project:'')+' - '+(val['Group/Client']?val['Group/Client']:'')+' - '+(val.Tags?val.Tags:'')
              }
            }
            break;
          case "pivotal":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : val.Hours?val.Hours:null
                  , item : (val['Given Name']?val['Given Name']:'')+' '+(val['Last Name']?val['Last Name']:'')+' - '+ (val.Project?val.Project:'')
                  , type : 'Time'
                  , note : (val.Description?val.Description:'')
              }
            }
            break;
          case "freshbooksExpense":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('-')):null
                  , qty : 1
                  , cost : val.Amount?Number(val.Amount):null
                  , item : val.Category?val.Category:''
                  , type : 'Item'
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Vendor?val.Vendor:'')+' - '+(val.Project?val.Project:'')
                  , total : (val.Amount)? val.Amount:null
              }
            }
            break;
          case "freshbooksTime":
            rule=function(val){
              return {
                    date: val['Invoice Date']?new Date(val['Invoice Date'].split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : val['Task name']?val['Task name']:''
                  , type : 'Time'
                  , cost: (val.Rate && typeof val.Rate==='string')?Number(val.Rate.replace(',','')):val.Rate
                  , note : (val['Client name']?val['Client name']:'')
                  , total : (val.Hours && val.Rate && typeof val.Rate==='string')?Number(val.Hours)*Number(val.Rate.replace(',','')):val.Rate
              }
            }
            break;
          case "toggl":
            rule=function(val){
              return {
                    date: val['Start date']?new Date(val['Start date'].split('-')):null
                  , qty : val.Duration?parseTimeQuantity(val.Duration):null
                  , item : val.User?val.User:null
                  , type : 'Time'
                  , note : (val.Description?val.Description:'')+' - '+(val.Client?val.Client:'')+' - '+(val.Project?val.Project:'')
              }
            }
            break;
          case "harvest":
            rule=function(val){
              return {
                    date: val.Date?new Date(val.Date.split('/')):null
                  , qty : val.Hours?Number(val.Hours):null
                  , item : (val['Last Name']?val['Last Name']:null)+', '+(val['First Name']?val['First Name']:null)
                  , type : 'Time'
                  , cost: val['Hourly Rate']? Number( val['Hourly Rate'].replace(',','') ):null
                  , note : (val.Notes?val.Notes:'')+' - '+(val.Job?val.Job:'')+' - '+(val.Category?val.Category:'')+' - '+(val.Project?val.Project:'')
                  , total : (val.Hours && val['Hourly Rate'])?Number(val.Hours)*val['Hourly Rate']:null
              }
            }
            break;
        }
        return {
           mapper:rule
          ,keyString :key

        };//We returnt he rule for building the JSON
      };
