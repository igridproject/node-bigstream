function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var output_type = "object/sds" 
  var data = request.data;

  let result = [];

  var nfiles = data.data.length;
  var i = 0;

  while (i < nfiles) {
      var filename = data.data[i].filename;
      var filecontent = data.data[i].value;
      var arr = filecontent.toString().split("\r\n");
      var arr_type = arr[1].split(",");
      var arr_unit = arr[2].split(",");
      var arr_value_type = arr[3].split(",");
      var ndata = arr_type.length;
      var col = 1;
      
      let _result = {
        "object_type":"sds",
        "station_id" : filename,  // need to change to exact station
        "latitude":"",
        "longitude";"", 
        "altitude":"",
        "data":[]
      };

      while (col < ndata) {
        var row = 4;
        let values = [];
        while (row < arr.length-1) {
          var rdata = arr[row].split(",");
          values.push({
            "observeddatetime":rdata[0].replace('"','').replace('"',''),
            "value":rdata[col]
          });
          row++;
        }   
        _result.data.push({
          "type": arr_type[col].replace('"','').replace('"',''),
          "unit": arr_unit[col].replace('"','').replace('"',''),
          "value_type" : arr_value_type[col].replace('"','').replace('"',''),
          "values":values
        });

        col++;
      }  
      result.push(_result);
      i++;
    }

    response.success(result,output_type);
    //response.reject();
    //response.error("error message")

}

module.exports = perform_function;
