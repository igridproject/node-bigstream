var ctx = require('../../../context');

var RPCCaller = ctx.getLib('lib/amqp/rpccaller');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var bsdata = ctx.getLib('lib/model/bsdata');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;

  var amqp_cfg = ctx.config.amqp;
  var storage_name = param.storage_name;

  var caller = new RPCCaller({
    url : amqp_cfg.url,
    name :'storage_request'
  });

  var dc_meta = {
    "_jid" : job_id,
    "_tid" : transaction_id,
    "_ts" : Math.round((new Date).getTime() / 1000)
  }
   var dc_data = bsdata.create(data).serialize('object-encoded');

  var req = {
      'object_type' : 'storage_request',
      'command' : 'write',
      'param' : {
        'storage_name' : storage_name,
        'meta' : dc_meta,
        'data' : {
          'type' : 'bsdata',
          'value' : dc_data
        }
      }
    }


  caller.call(req,function(err,resp){
    if(!err && resp.status=='OK'){
      response.success();
    }else{
      response.error("storage error")
    }
  });

  // response.success();
  // response.reject();
  // response.error("error message")

}

module.exports = perform_function;
