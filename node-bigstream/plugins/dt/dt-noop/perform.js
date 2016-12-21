function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;


  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });
  data = data.a.b + "--DT--";

  response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
