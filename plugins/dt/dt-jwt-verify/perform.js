var jwt = require('jsonwebtoken');

var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param || {};
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta || {};

  var req_token = param.token || ""
  var req_secret = param.secret || ""

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }
 
  req_secret = Utils.vm_execute_text(env,req_secret);
  req_token = Utils.vm_execute_text(env,req_token);

  var jwtout = {
    "error":true,
    "decode":{}
  }

  jwt.verify(req_token, req_secret, function(err, decoded) {
    if(!err){
      jwtout.error=false;
      jwtout.decode=decoded;
    }
    meta.jwt = jwtout
    response.meta = meta;
    response.success(data,output_type);
  });

  //response.success();
  //response.reject();
  //response.error("error message")
}

module.exports = perform_function;
