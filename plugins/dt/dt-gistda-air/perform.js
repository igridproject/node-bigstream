var async = require('async');

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

  async.whilst(
      function() { return i < nfiles; },
      function(callback) {
          var filename = data.data[i].filename;
          var station_id = data.data[i].station_id;
          var latitude = data.data[i].latitude;
          var longitude = data.data[i].longitude;
          var data_type = data.data[i].type;
          var filecontent = data.data[i].value;
          var observeddatetime = data.data[i].observeddatetime;
          i++;

          let _result = {
            "object_type":"sds",
            "station_id" : station_id,  // need to change to exact station
            "latitude":latitude,
            "longitude":longitude, 
            "data":[]
          };

          if (data_type == 'text') {
              _result = perform_text(_result, filecontent);
              result.push(_result);
              callback();
          } else if (data_type == 'image') {
              getImage(filecontent).then((base64) => {
                var values = [];
                var avalue = {};
                avalue["observeddatetime"] = observeddatetime;
                avalue["value"] = base64;
                values.push(avalue);
                _result.data.push({"type":"image", "values":values});  
                result.push(_result);
                callback();
              }).catch((err) => {
                throw err
              });
          }
      },
      function (err, n) {
         response.success(result,output_type);
      }
  );

//   while (i < nfiles) {
//       var filename = data.data[i].filename;
//       var data_type = data.data[i].type;
//       var filecontent = data.data[i].value;
     
//       let _result = {
//         "object_type":"sds",
//         "station_id" : filename,  // need to change to exact station
//         "latitude":"",
//         "longitude":"", 
//         "altitude":"",
//         "data":[]
//       };

//       if (data_type == 'text')
//         _result = perform_text(_result, filecontent);
//       else if (data_type == 'image') {
// //        _result = perform_image(_result, filecontent);
//         getImage(filecontent).then((base64) => {
//           _result.data.push({"values":base64});  
//           console.log("after get image");
//         }).catch((err) => {
//           throw err
//         });
//       }
//       console.log("will result");
//       result.push(_result);
//       i++;
//   }

//   response.success(result,output_type);
//     //response.reject();
//     //response.error("error message")

}

function perform_text(_result, filecontent) {

  var arr = filecontent.toString().split("\r\n");
  var arr_type = arr[1].split(",");
  var arr_unit = arr[2].split(",");
  var arr_value_type = arr[3].split(",");
  var ndata = arr_type.length;
  var col = 1;

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
  return _result;
}

function perform_image(_result, filecontent) {

  getImage(filecontent).then((base64) => {
    _result.data.push({"values":base64});  
  }).catch((err) => {
    throw err
  });
  return _result;   
}

function getImage(filecontent) {
  return  new Promise((resolve, reject) => {
      resolve("data:image;base64," + new Buffer(filecontent).toString('base64'));
  });    
}

module.exports = perform_function;
