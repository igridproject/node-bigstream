var async = require('async');
var parser = require('xml2json');
var fs = require('fs');
var agriParser = require('./parser/agri_parser_factory');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.job.memstore
  // var memstore = context.task.memstore

  var output_type = request.input_type;
  var di_data = request.data;

  let idx = 0;
  let result = {
    "object_type": 'iBitz',
    "station_id": di_data.station_id,
    "latitude": "",
    "longitude": "",
    "data":[]
  };
    
  async.whilst(function() { return idx < di_data.data.length;}, function(callback) {
    let dtype = di_data.data[idx].data_types;
    
    if(di_data.data[idx].value.length > 0){
      let json = parser.toJson(di_data.data[idx].value[0], {object: true});
      agriParser.getParser(json.xhr.IO.Type).getValues(di_data.data[idx].value, function(values) {
        idx++;
        if(values !== null){
            result.latitude = json.xhr.IO.Latitude;
            result.longitude = json.xhr.IO.Longitude;
            result.data.push(values);
            //console.log(`STAMP : ${di_data.station_id}-${dtype} = `+ values.values[values.values.length-1].observeddatetime);
            memstore.setItem(`${di_data.station_id}-${dtype}`, values.values[values.values.length-1].observeddatetime, (err) =>{
              if(err) throw err;
              callback();
            });
        }
        else callback(); 
      });
    }
    
    
      
  }, function(err) {
      if( err ) {
        console.log(err);
      } else {
        fs.writeFileSync("./result.json", JSON.stringify(result));
        //console.log(JSON.stringify(result));
        response.success(result, output_type);
      }
  });

}

module.exports = perform_function;
