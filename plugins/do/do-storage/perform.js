var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

var RPCCaller = ctx.getLib('lib/amqp/rpccaller');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var bsdata = ctx.getLib('lib/model/bsdata');

var async = require('async');
const ACL_SERVICE_NAME = "storage";

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var job_vo = context.jobconfig._vo || '';
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;
  var storagecaller = context.task.storagecaller;
  var acl_validator = context.acl_validator;

  var output_type = request.input_type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta;

  var amqp_cfg = ctx.config.amqp;
  var storage_name = param.storage_name;

  // var caller = new RPCCaller({
  //   url : amqp_cfg.url,
  //   name :'storage_request'
  // });

  var caller = storagecaller;

  // if(param.channel!='ipc'){
  //   caller = new RPCCaller({
  //     url : amqp_cfg.url,
  //     name :'storage_request'
  //   });
  // }


  var dc_meta = {
    "_jid" : job_id,
    "_tid" : transaction_id,
    "_ts" : Math.round((new Date).getTime() / 1000)
  }

  if(meta && typeof meta == 'object')
  {
    Object.keys(meta).forEach((item)=>{
      if(!item.startsWith('_') || item=='_key'){
        dc_meta[item] = meta[item];
      }
    });
  }

  var def_acl = [
    {
      'accept':true,
      'resource':(job_vo=='$'||job_vo=='')?'*':job_vo + '.*'
    }
  ];

  var idx = 0;
  async.whilst(
      function() { return idx < data.length; },
      function(callback) {
        var el_data = bsdata.create(data[idx]).serialize('object-encoded');
        var ev =  {
          'type' : output_type,
          'meta' : meta,
          'data' : data[idx]
        }

        var sname=Utils.vm_execute_text(ev,storage_name);

        if(sname){
          //storage permission
          var acp = acl_validator.isAccept(def_acl,{
            "vo":job_vo,"service":ACL_SERVICE_NAME,"resource":sname,"mode":"w"
          });
          
          if(acp){
            send_storage(caller,dc_meta,el_data,sname,function(err){
              if(!err){
                idx++;
                callback(null);
              }else{
                callback(new Error('storage error'));
              }
            });
          }else{
            callback('storage permission error');
          }

        }else{
          callback('invalid storage');
        }

      },
      function (err) {
        if(!err){
          response.success();
        }else{
          console.log(err);
          response.error("storage error");
        }
      }

  );

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
//console.log(req);
  caller.call(req,function(err,resp){
    if(!err && resp.status=='OK'){
      cb(null);
    }else{
      cb("error");
    }
  });

}

module.exports = perform_function;
