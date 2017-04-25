function perform_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.task.memstore

  var output_type = 'text'
  var data = 'hello world ' + transaction_id;

  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction2',function(err,value){
  //   console.log('key');
  //   console.log(value);
  //   response.success(value);
  // });

  setTimeout(function(){
    response.success(data,output_type);
  },2000)
  //response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
