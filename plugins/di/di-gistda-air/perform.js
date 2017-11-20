var path = require('path');
var fs = require('fs');
var async = require('async');
var dateFormat = require('dateformat');
var Client = require('ftp');
   
function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var profile = context.jobconfig.data_in.profile;
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

  var key = param.path + '-lasttransaction';

  c.on('ready', function() {

      c.list(param.path, function(err, list) {
          if (err) throw err;

          memstore.getItem(key,function(err,value) {
              if (err) throw err;

              var latestDate;
              if (!value) {
                var latestDateStr = param.init_observed_date + ' ' + param.init_observed_time; //'2016-12-20T10:00:00+04:00';
                latestDate = new Date(latestDateStr);
              } else {
                latestDate = new Date(value);
              }

              async.eachSeries(
                  list,
                  function(element, callback) {
                      if (typeof element !== 'undefined') {
                          if (element.type !== 'd') {  // filter out directories
                              var filename = element.name;
                              var filedate = element.date;
                              var filetype = element.type;
//                              if ((path.extname(filename) === '.dat' || path.extname(filename) === '.jpg') && filename.indexOf("debug") == -1) {  
                              if ((path.extname(filename) === '.dat' && 
                                    (filename.indexOf("Every_5m") > 0 || (filename.indexOf("MS700") > 0 && filename.indexOf("debug") == -1)))
                                  || path.extname(filename) === '.jpg')  {  

                                  var type = 'text';
                                  if (path.extname(filename) === '.jpg')
                                    type = 'image';
                                  
                                  if (filedate - latestDate > 0) {  // filter out old files
                                      c.get(param.path+"/"+filename, function (err, stream) {
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
                                                "station_id": profile.station_id,
                                                "latitude": profile.latitude,
                                                "longitude": profile.longitude,
                                                "type": type,
                                                "observeddatetime": dateFormat(filedate, 'yyyy-mm-dd HH:MM:ss'),
                                                "value" : data
                                              });
                                              if (typeof maxdate == 'undefined') {
                                                  maxdate = filedate;
                                              } else {
                                                 if (filedate - maxdate > 0) {
                                                   maxdate = filedate;
                                                 }
                                              }
                                              memstore.setItem(key,dateFormat(maxdate, 'yyyy-mm-dd HH:MM:ss'),function(err){
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
