var ctx = require('../../../context');

var RPCCaller = ctx.getLib('lib/amqp/rpccaller');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var bsdata = ctx.getLib('lib/model/bsdata');

var async = require('async');

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

  if(Array.isArray(data)){
    var idx = 0;
    async.whilst(
        function() { return idx < data.length; },
        function(callback) {
          var el_data = bsdata.create(data[idx]).serialize('object-encoded');
          send_storage(caller,dc_meta,el_data,storage_name,function(err){
            idx++;
            if(!err){
              callback(null);
            }else{
              callback(err);
            }
          });
        },
        function (err) {
          if(!err){
            response.success();
          }else{
            response.error("storage error");
          }
        }
    );

  }else{
    var dc_data = bsdata.create(data).serialize('object-encoded');
    send_storage(caller,dc_meta,dc_data,storage_name,function(err){
      if(!err){
        response.success();
      }else{
        response.error("storage error");
      }
    });

  }

}


function send_storage(caller,dc_meta,dc_data,storage_name,cb)
{
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
      cb(null);
    }else{
      cb("error");
    }
  });

}

module.exports = perform_function;
