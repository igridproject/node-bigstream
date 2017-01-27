var ctx = require('../../../context');
var fs = require('fs');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;

  var bss_filename = param.filename;
  var dc_meta = {
    "_jid" : job_id,
    "_tid" : transaction_id,
    "_ts" : Math.round((new Date).getTime() / 1000)
  }
  var dc_data = data;

  if(fs.existsSync(bss_filename)){
    bss_write(bss_filename,dc_meta,dc_data,response);
  }else{
    BinStream.format(bss_filename,function(err){
      if(!err){
        bss_write(bss_filename,dc_meta,dc_data,response);
      }else{
        response.error(err);
      }
    });
  }

  //response.success();
  //response.reject();
  //response.error("error message")

}

function bss_write(fn,meta,data,response)
{
  BinStream.open(fn,function(err,bss){
      if(!bss){
        response.error(err);
        return;
      }
      bss.write(data,{meta:meta},function(err,obj){
        if(!err){
          bss.close(function(err){
            response.success();
          });
        }else{
          bss.close(function(err){
            response.error("ERROR");
          });
        }
      });

  });
}

module.exports = perform_function;
