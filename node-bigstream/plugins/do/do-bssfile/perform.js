var ctx = require('../../../context');
var fs = require('fs');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var async = require('async');

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

      var arrData = [];

      if(!Array.isArray(data)){
        arrData.push(data);
      }else{
        arrData = data;
      }

      var idx = 0;
      async.whilst(
          function() { return idx < arrData.length; },
          function(callback) {
            bss.write(arrData,{meta:meta},function(err,obj){
              callback(err);
            });
          },
          function (err) {
            if(!err){
              bss.close(function(err){
                response.success();
              });
            }else{
              bss.close(function(err){
                response.error("ERROR");
              });
            }
          }
      );

  });
}

module.exports = perform_function;
