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

  var req_function = param.function || "decrypt"
  var req_publickey = param.publickey || ""
  var req_privatekey = param.privatekey || ""
  var req_passphrase = param.passphrase || ""

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }

  req_publickey = Utils.vm_execute_text(env,req_publickey);
  req_privatekey = Utils.vm_execute_text(env,req_privatekey);
  req_passphrase = Utils.vm_execute_text(env,req_passphrase);

  //parsing param from meta
  if(typeof meta._param == 'object')
  {
    var _prm = meta._param;
    req_function = (_prm.function)?_prm.function:req_function;
    req_publickey = (_prm.publickey)?_prm.publickey:req_publickey;
    req_privatekey = (_prm.privatekey)?_prm.privatekey:req_privatekey;
    req_passphrase = (_prm.passphrase)?_prm.passphrase:req_passphrase;
  }

  



    respmeta['_status_code'] = (err)?0:resp.statusCode;
    respmeta['_error'] = (err)?true:false;
    response.meta = respmeta;

    if(!err){
      if(resp_encode=='json'){
        try{
          var j = JSON.parse(body);
          response.success(j,output_type);
        }catch(err){
          response.success({},output_type);
        }
      }else{
        response.success(body,output_type);
      }
    }else{
      response.success(null,output_type);
    }


  //response.success();
  //response.reject();
  //response.error("error message")
}


module.exports = perform_function;
