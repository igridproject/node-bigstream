var async = require('async');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var output_type = "object/tpb" 
  var data = request.data;

  let result = {
    "object_type": "tpb",
    "station_id": data.station_id,
    "latitude": data.latitude,
    "longiude": data.logitude,
    "altitude": data.altitude,
  };

  var data_type = 'Rain';

  var dataset = data.data;
  var counter = 0;

  async.each(
    dataset, 
    function(adata, callback) {
      if (adata.type == data_type) {
        result.type = adata.type;
        result.unit = adata.unit;
        result.value_type = adata.value_type;
        result.values = adata.values;
        console.log(result);
        counter = 1;
      }
      callback();
    },
    function(err) {
      if (err) {
          response.error(err);
        } else if (counter == 0) {
          response.reject() ;
      }

    }
  );

  response.success(result,output_type);
    //response.reject();
    //response.error("error message")

}

module.exports = perform_function;
