var path = require('path');
var fs = require('fs');
var async = require('async');
var dateFormat = require('dateformat');
var Client = require('ftp');

function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.task.memstore

  var output_type = 'object/gistda-air'

  var config = {
          host: param.url,
          port: param.port,
          user: param.user,
          password: param.password
  };

  let result = {
    "object_type": param.source,
    "data":[]
  };

  let maxdate;

  var c = new Client();

  c.on('ready', function() {
      c.list(function(err, list) {
          if (err) throw err;

          memstore.getItem('lasttransaction',function(err,value) {
              if (err) throw err;

              var latestDate;
              if (typeof value == 'undefined') {
                var latestDateStr = param.init_observed_date + ' ' + param.init_observed_time; //'2016-12-20T10:00:00+04:00';
                latestDate = new Date(latestDateStr);
              } else {
                // var date = value.substring(0, 10);
                // var time = value.substring(11,19)
                // latestDate = new Date(date + ' ' + time);
                latestDate = new Date(value);
              }

              console.log(value + " !!! " + latestDate);
              
              async.eachSeries(
                  list,
                  function(element, callback) {
                      if (typeof element !== 'undefined') {
                          if (element.type !== 'd') {  // filter out directories
                              var filename = element.name;
                              var filedate = element.date;
                              var filetype = element.type;

                              if (path.extname(filename) === '.dat' && filename.indexOf("debug") == -1) {  
                                  if (filedate - latestDate > 0) {  // filter out old files
                                      c.get(filename, function (err, stream) {
                                          if (err) throw err;
                                          var data = '';
                                          stream.setEncoding('utf8');
                                          console.log("downloading .... : " + filename + ", " + dateFormat(filedate, "isoDateTime")); 
                                          stream.on('data', function(chunk) {  // donwload each individual chunk as per a downloading file
                                              if (chunk != '')
                                                data = data + chunk;                                        
                                          });
                                          stream.on('end', function () {  // insert a data file
                                              result.data.push({
                                                "filename": filename,
                                                "value" : data
                                              });
                                              if (typeof maxdate == 'undefined') {
                                                  maxdate = filedate;
                                              } else {
                                                 if (filedate - maxdate > 0) {
                                                   maxdate = filedate;
                                                 }
                                              }
                                              memstore.setItem('lasttransaction',dateFormat(maxdate, "isoDateTime"),function(err){
                                                if (err) throw err;
                                                callback();
                                              });
                                          });
                                          // stream.pipe(fs.createWriteStream(filename));
                                      });

                                  } else {
                                      async.setImmediate(callback);
                                      //callback(null);
                                    }
                              } else {
                                  async.setImmediate(callback);
                                  //callback(null);
                                }
                          } else
                              async.setImmediate(callback);
                              //callback(null);  
                      } else
                          async.setImmediate(callback);
                          //callback(null);                
                  },                  
                  function(err) {
                      if (err) {
                        response.error(err);
                      } else {
                        if (result.data.length == 0)
                          response.reject();    // for no data
                        else
                          response.success(result, output_type);
                        c.end();
                      }
                  }
              ); // async close
          }); // memstore close
      });
  });

  c.connect(config);  


  //response.reject();

}



module.exports = execute_function;
