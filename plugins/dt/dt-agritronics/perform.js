function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var di_data = request.data;

  var agriParser = require('./parser/agri_parser_factory');
  var async = require('async');
  var parser = require('xml2json');
  var fs = require('fs');

  let idx = 0;
  let result = {
    "object_type": 'iBitz',
    "station_id": di_data.station_id,
    "latitude": "",
    "longitude": "",
    "data":[]
  };
    
  //console.log(json_table.length);
  async.whilst(function() { return idx < di_data.data.length;}, function(callback) {
    let json = parser.toJson(di_data.data[idx].value, {object: true});
    idx++;
    if(typeof json.xhr.IO.Data !== 'undefined') {
      agriParser.getParser(json.xhr.IO.Type).getValues(json, (values) => {
        if(values !== null){
            result.latitude = json.xhr.IO.Latitude;
            result.longitude = json.xhr.IO.Longitude;
            result.data.push(values);
            callback();
        }
      });
    }
      
  }, function(err) {
    console.log("CB");
      if( err ) {
        console.log(err);
      } else {
        console.log('data out...');
        fs.writeFileSync("./result.json", JSON.stringify(result));
        //console.log(JSON.stringify(result));
        response.success(result,output_type);
      }
  });


  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });
  //data = data + "--DT--"

  
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
