function perform_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param || {};
  var memstore = context.task.memstore;
  var input_data = context.input_data;
  var output_type = 'object'
  var data = input_data;


  if(param.object == 'httpdata')
  {
    data = extract_httpdata(input_data);
  }
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });


  response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

function extract_httpdata(dat)
{
  if(dat.object_type == 'httpdata'){
    return dat.data;
  }else{
    return dat;
  }
}


module.exports = perform_function;
