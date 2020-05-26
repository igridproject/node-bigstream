var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var pgplib = require('./pgp');
var path = require('path');
var fs = require('fs');

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
  var req_output = param.output|| "binary"

  var key_dir = ctx.getConfig('keystore.dir','./keys');
  var fn_load_key = function (name) {
    var k = "";
    var fp = path.join(key_dir ,path.basename(name));
    try{
      k = fs.readFileSync(fp).toString('utf8');
    }catch(e){

    }

    return k;
  }

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta,
    '_fn' : {
      'load_key' : fn_load_key
    }
  }

  req_publickey = Utils.vm_execute_text(env,req_publickey);
  req_privatekey = Utils.vm_execute_text(env,req_privatekey);
  req_passphrase = Utils.vm_execute_text(env,req_passphrase);
  req_output = Utils.vm_execute_text(env,req_output);

  //parsing param from meta
  if(typeof meta._param == 'object')
  {
    var _prm = meta._param;
    req_function = (_prm.function)?_prm.function:req_function;
    req_publickey = (_prm.publickey)?_prm.publickey:req_publickey;
    req_privatekey = (_prm.privatekey)?_prm.privatekey:req_privatekey;
    req_passphrase = (_prm.passphrase)?_prm.passphrase:req_passphrase;
    req_output = (_prm.output)?_prm.output:req_output;
  }

  if (['decrypt','dec'].indexOf(req_function) >= 0){
    pgplib.decrypt({
      private_key : req_privatekey,
      passphrase : req_passphrase,
      armor_in : (typeof data == 'string'),
      data : data
    }).then(d => {
      var dout = d;
      if(['utf8','text'].indexOf(req_output) >= 0){
        dout = d.toString('utf8');
      }else if(req_output == 'base64'){
        dout = d.toString('base64');
      }
      ok_out(dout);
    }).catch(e =>{
      error_out('decrypt error');
    })
  } else if (['encrypt','enc'].indexOf(req_function) >= 0){
    pgplib.encrypt({
      public_key : req_publickey,
      armor_out : (['armor','text'].indexOf(req_output) >= 0),
      data : data
    }).then(d => {
      ok_out(d);
    }).catch(e =>{
      error_out('decrypt error');
    })
  } else {
    error_out('invalid function')
  }


  function ok_out (out)
  {
    response.meta = meta;
    response.success(out,output_type);
  }

  function error_out (msg)
  {
    response.error(msg);
  }


  //response.success();
  //response.reject();
  //response.error("error message")
}


module.exports = perform_function;
