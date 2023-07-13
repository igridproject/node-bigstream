var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

var request = require("request");

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta;

  var req_url = param.url || "";
  var req_method = param.method || "GET";
  var req_body_type = param.body_type || "json";

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }

  var req_url = Utils.vm_execute_text(env,req_url);
  

  send_request({'url':req_url,'method':req_method,'headers':param.headers,'body_type':req_body_type,'body':data},function(err){
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

function send_request(prm,cb)
{

  var options = { method: 'GET',
    url: prm.url,
    headers:
     { 'cache-control': 'no-cache' }
  };

  if(['post','put','delete','patch'].includes(prm.method.toLowerCase()))
  {
    options.method = prm.method.toUpperCase();

    if(prm.body_type=='json' && typeof prm.body == 'object'){
      options.headers['content-type'] = 'application/json';
      options.json = prm.body;
    }else if(prm.body_type=='text' || typeof prm.body == 'string'){
      options.headers['content-type'] = 'text/plain';
      options.body = prm.body;
    }else{
      options.body = prm.body;
    }
  }

  if(typeof prm.headers == 'object')
  {
    options.headers = Object.assign(options.headers,prm.headers)
  }

  request(options, function (err, resp, body) {
    if (!err) {
      cb();
    }else{
      cb(new Error("request error"));
    }
  });

}

module.exports = perform_function;
