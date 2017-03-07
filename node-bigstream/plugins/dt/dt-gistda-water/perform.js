function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var output_type = "object/sds" 
  var data = request.data;

  let result = {
    "object_type": "sds",
    "station_id": data.DEVID,
    "latitude": data.LATI,
    "longiude": data.LOGI,
    "altitude": data.Z,
    "data":[]  
  };

  let VBATT_values = [];
  VBATT_values.push({
    "observeddatetime": data.TIME,
    "value": data.VBATT
  })

  result.data.push({
    "type": "VBATT",
    "unit": "",
    "value_type" : "",
    "values": VBATT_values
  });

  let LEVEL_values = [];
  LEVEL_values.push({
    "observeddatetime": data.TIME,
    "value": data.LEVEL
  })

  result.data.push({
    "type": "LEVEL",
    "unit": "",
    "value_type" : "",
    "values": LEVEL_values
  });  

  response.success(result,output_type);
    //response.reject();
    //response.error("error message")

}

module.exports = perform_function;
