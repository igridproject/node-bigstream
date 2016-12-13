function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.job.transaction_id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.job.memstore

  var data = 'hello world';


  //memstore.setvalue('timestamp.xxx',ts)



  //response.reject();
  //response.error("error message")
  //response.success(data);
}

module.exports = execute_function;
