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

  var output_type = 'jsonobject'

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

  var c = new Client();

  c.on('ready', function() {
      c.list(function(err, list) {
          if (err) throw err;
          var latestDateStr = param.init_observed_date + ' ' + param.init_observed_time; //'2016-12-20T10:00:00+04:00';
          var latestDate = new Date(latestDateStr);

          var count = 0;

          async.eachSeries(
              list,
              function(element, callback) {
                  if (typeof element !== 'undefined') {
                      if (element.type !== 'd') {
                          var filename = element.name;
                          var filedate = element.date;
                          var filetype = element.type;
                          if (path.extname(filename) === '.dat' && filename.indexOf("debug") == -1) {  
                              if (filedate - latestDate > 0) {

                                  c.get(filename, function (err, stream) {
                                      if (err) return console.error(err);
                                      var data = '';
                                      stream.setEncoding('utf8');
                                      console.log("downloading .... : " + filename + ", " + dateFormat(filedate, "isoDateTime")); 
                                      stream.on('data', function(chunk) {
                                          if (chunk != '')
                                            data = data + chunk;                                        
                                      });
                                      stream.on('end', function () {
                                          result.data.push({
                                            "filename": filename,
                                            "value" : data
                                          });
                                          callback();
                                      });
                                      // stream.pipe(fs.createWriteStream(filename));
                                  });

                              } else
                                  callback();
                          } else
                              callback();

                      } else
                          callback();  
                  } else
                      callback();                
              },
              function(err) {
                  if( err ) {
                    response.error(err);
                  } else {
                    response.success(result, output_type);
                    c.end();
                  }
              }
          );

      });
    }
  );

  c.connect(config);  
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });


  //response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

module.exports = execute_function;
