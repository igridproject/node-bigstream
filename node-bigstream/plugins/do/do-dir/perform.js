var ctx = require('../../../context');
var fs = require('fs');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;

  var path = param.path;

  if(fs.lstatSync(path).isDirectory())
  {
    var filepath = path + '/' + job_id + '-' + transaction_id + '.out';
    fs.writeFile(filepath, to_string(data), function(err) {
      if(err) {
          response.error(err)
      }else{
          response.success();
      }

    });

  }else{
    response.error("Invalid Dir")
  }


  //response.success();
  //response.reject();
  //response.error("error message")

}

function to_string(obj)
{
  var str_data = '';
  switch (typeof obj) {
    case 'string':
      str_data = obj;
      break;
    case 'object':
      if (obj === null) {
        str_data = 'null';
      }else if(obj instanceof Buffer){
        str_data = obj.toString('base64');
      }else{
        str_data = JSON.stringify(obj);
      }
      break;
    default :
      str_data = '';
  }

  return str_data;
}

module.exports = perform_function;
