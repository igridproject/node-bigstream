var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var bsdata = ctx.getLib('lib/model/bsdata');

var request = require("request");

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta;

  var token = param.token;
  var api_url = param.api;
  var storage_name = param.storage_name;

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }

  var sname = Utils.vm_execute_text(env,storage_name);
  var en_data = bsdata.create(data).serialize('object-encoded');
  
  var storage_url = api_url + '/storage/' + sname
  var msgbody = {
    'meta':meta,
    'data':en_data
  }

  send_to_storage({'api':storage_url,'token':token,'body':msgbody},function(err){
    if(!err){
      response.success();
    }else{
      response.error(err);
    }
  })
  //response.success();
  //response.reject();
  //response.error("error message")
}

function send_to_storage(prm,cb)
{

  var options = { method: 'PUT',
    url: prm.api,
    headers:
     { 'cache-control': 'no-cache',
       'content-type': 'application/json' },
    json: prm.body
  };

  if(prm.token){options.headers.authorization='Bearer ' + prm.token;}


  request(options, function (err, resp, body) {
    if (!err && resp.statusCode==200) {
      cb();
    }else{
      cb(new Error("api error"));
    }
  });

}

module.exports = perform_function;
