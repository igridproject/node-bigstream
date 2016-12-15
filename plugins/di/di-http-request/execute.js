var request = require('request');

function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.task.memstore

  var output_type = 'text'
  var url = param.url;

  request(url, function (error, resp, body) {
    if (!error && resp.statusCode == 200) {
      response.success(body);
    }else{
      response.error(error);
    }
  })
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });


  //response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

module.exports = execute_function;
