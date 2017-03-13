var async = require('async');
var parser = require('xml2json');
//var fs = require('fs');
var agriParser = require('./parser/agri_parser_factory');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.job.memstore
  // var memstore = context.task.memstore

  var output_type = "object/sds";
  var di_data = request.data;

  
  let out = [];
  

  var dataKeySeries = Object.keys(di_data.data);

  // for (var k = 0; k < dataKeySeries.length; k++) {
  //   console.log(di_data.data[dataKeySeries[k]]);
  // }
  let i = 0;
  async.whilst(function() { return i < dataKeySeries.length;}, function(cb) {
    let result = {
      "object_type": 'iBitz',
      "station_id": di_data.station_id,
      "latitude": "",
      "longitude": "",
      "altitude": "",
      "data":[]
    };
    let vals = di_data.data[dataKeySeries[i]];
    i++;
    let idx = 0;
    async.whilst(function() { return idx < vals.length;}, function(callback) {
      let dtype = vals[idx].data_types;
      //console.log('[DT] di_data length = ' + vals[idx].value.length);
      let json = parser.toJson(vals[idx].value, {object: true});
      //console.log('Type = ' + json.xhr.IO.Type);
      agriParser.getParser(json.xhr.IO.Type).getValues(vals[idx].value, function(values) {
        
        idx++;
        if(values !== null){
            result.latitude = json.xhr.IO.Latitude;
            result.longitude = json.xhr.IO.Longitude;
            result.data.push(values);
            //console.log(`STAMP : ${di_data.station_id}-${dtype} = `+ values.values[values.values.length-1].observeddatetime);
            memstore.setItem(`${di_data.station_id}-${dtype}`, values.values[values.values.length-1].observeddatetime, (err) =>{
              if(err){
                throw err;
                callback(err);
              } 
              else callback();
            });
        }
        else callback();
        
      });


    }, function(err) {
        if( err ) {
          console.log(err);
          cb(err);
          //response.error(err);
        } else {
          if(result.data.length > 0){
            out.push(result);
          }
          cb();
        }
    });
  }, function(err) {
        if( err ) {
          console.log(err);
          //response.error(err);
        } else {
          //fs.writeFileSync("./result.json", JSON.stringify(out));
          //console.log(JSON.stringify(out));
          if(out.length > 0)
            response.success(out, output_type);
          else response.reject();
        }
    });

}

module.exports = perform_function;
