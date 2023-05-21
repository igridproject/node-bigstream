
var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');


function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var job_vo = context.jobconfig._vo || '';
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;
  var msgsender = context.task.msgsender;

  var in_type = request.type;
  var data = request.data;
  var meta = request.meta;

  var prm_session = param.session || meta._sid;

  var ev =  {
    'type' : in_type,
    'meta' : meta,
    'data' : data
  }
  
  prm_session = Utils.vm_execute_text(ev,prm_session)
  var topic = "msg.httpcb." + prm_session
  var msg = {
    'err':null,
    'meta':meta,
    'data':data
  }

  msgsender.send(topic,msg)

  response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
