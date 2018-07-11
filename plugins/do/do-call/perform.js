
var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var bsdata = ctx.getLib('lib/model/bsdata');
const ACL_SERVICE_NAME = "job";

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var job_vo = context.jobconfig._vo || '';
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;
  var jobcaller = context.task.jobcaller;
  var acl_validator = context.acl_validator;

  var in_type = request.type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta;

  var prm_to = (Array.isArray(param.to))?param.to:[param.to];

  var def_acl = [
    {
      'accept':true,
      'resource':(job_vo=='$'||job_vo=='')?'*':job_vo + '.*'
    }
  ];

  data.forEach((dat)=>{
    prm_to.forEach((jobprm)=>{
      var ev =  {
        'type' : in_type,
        'meta' : meta,
        'data' : dat
      }
      var job=Utils.vm_execute_text(ev,jobprm)
      var acp = acl_validator.isAccept(def_acl,{
        "vo":job_vo,"service":ACL_SERVICE_NAME,"resource":job,"mode":"x"
      });
      if(acp){
        call_to(dat,job);
      }else{
        console.log('[Warn] Calling job :: ' + job + ' -> Not Permited')
      }
    });
  });


  function call_to(obj,target)
  {
    var job_id = null;
    if(typeof target == 'string')
    {
      job_id = target;
    }else{return;}

    var cmd = {
      'object_type':'job_execute',
      'source' : 'do',
      'jobId' : job_id,
      'option' : {'exe_level':'secondary'},
      'input_meta' : meta,
      'input_data' : {
        'type' : 'bsdata',
        'value' : bsdata.create(obj).serialize('object-encoded')
      }
    }

    jobcaller.send(cmd);
  }

  response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
