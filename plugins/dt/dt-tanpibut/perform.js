var async = require('async');
//var fs = require('fs');
var agriParser = require('./parser/agri_parser_factory');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var memstore = context.job.memstore
  // var memstore = context.task.memstore

  var output_type = "object/sds";
  let di_data = request.data;
  let dtype = di_data.data_type;
  
  let out = {
      "object_type": 'Tanpibut',
      "station_id": di_data.station_id,
      "data_type": dtype,
      "latitude": "",
      "longitude": "",
      "altitude": "",
      "unit": "",
      "value_type": "",
      "type": "",
      "data":[]
    };
  


  // for (var k = 0; k < dataKeySeries.length; k++) {
  //   console.log(di_data.data[dataKeySeries[k]]);
  // }
  let idx = 0;
  async.whilst(function() { return idx < di_data.data.length;}, function(callback) {
    agriParser.getParser(context.jobconfig.data_in.param.data_type.name).getValues(di_data.data[idx].value, function(value) {
      idx++;
      if(value !== null){
          out.latitude = value.latitude;
          out.longitude = value.longitude;
          out.unit = value.unit;
          out.value_type = value.value_type;
          out.type = value.type;
          for(var i=0; i<value.values.length; i++){
            out.data.push(value.values[i]);
          }
          //console.log(`STAMP : ${di_data.station_id}-${dtype} = `+ value.value[value.value.length-1].observeddatetime);
          memstore.setItem(`${di_data.station_id}-${dtype}`, value.values[value.values.length-1].observeddatetime, (err) =>{
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
        response.error(err);
      } else {
        //fs.writeFileSync("./result.json", JSON.stringify(out));
        if(out.data.length > 0){
          // console.log("Result"  + JSON.stringify(out));
          response.success(out, output_type);
        }
        else {
          if(context.jobconfig.data_in.param.recover){
            memstore.setItem(`${di_data.station_id}-${dtype}`, di_data.timestamp, (err) =>{
              response.reject();
            });
          }
          else response.reject();
        }
      }
  });

}

module.exports = perform_function;
