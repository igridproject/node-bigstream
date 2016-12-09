function execute_function(context,response){
  // var job_id = context.profile.job_id;
  // var transaction_id = context.profile.transaction_id;
  // var param = ctx.parameter;

  var data = 'hello world';

  setTimeout(function () {
    response.success(context.jobid + ' ' + data);
}, 1000);


  //response.cancel();
  //response.error("error message")
  //response.success(data);
}

module.exports = execute_function;
