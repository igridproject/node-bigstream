
var ctx = require('../../../context');
var bsdata = ctx.getLib('lib/model/bsdata');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;
  var jobcaller = context.task.jobcaller;

  var data = request.data;
  var meta = request.meta;

  var prm_to = param.to;

  if(Array.isArray(prm_to))
  {
    prm_to.forEach(function(job){
      call_to(job);
    });
  }else{
    call_to(prm_to);
  }


  function call_to(target)
  {
    var job_id = null;
    if(typeof target == 'string')
    {
      job_id = target;
    }else{return;}

    var cmd = {
      'object_type':'job_execute',
      'source' : 'scheduler',
      'jobId' : job_id,
      'option' : {'exe_level':'secondary'},
      'input_meta' : meta,
      'input_data' : {
        'type' : 'bsdata',
        'value' : bsdata.create(data).serialize('object-encoded')
      }
    }

    jobcaller.send(cmd);
  }

  response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
