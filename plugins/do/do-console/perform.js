function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta;


  if(meta){console.log('meta => ' + JSON.stringify(meta));}
  console.log('--- data ---');
  console.log(data);

  response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
