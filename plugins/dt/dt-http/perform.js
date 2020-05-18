var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

var request = require("request").defaults({ encoding: null });

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param || {};
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta || {};

  var req_url = param.url || "";
  var req_method = param.method || "GET";
  var req_headers = param.headers || {};
  var req_body_type = param.body_type || "json";
  var resp_encode = param.encoding || "text";

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }

  req_url = Utils.vm_execute_text(env,req_url);

  //parsing param from meta
  if(typeof meta._param == 'object')
  {
    var _prm = meta._param;
    req_url = (_prm.url)?_prm.url:req_url;
    req_method = (_prm.method)?_prm.method:req_method;
    req_headers = (_prm.headers)?_prm.headers:req_headers;
    req_body_type = (_prm.body_type)?_prm.body_type:req_body_type;
    resp_encode = (_prm.encoding)?_prm.encoding:resp_encode;
  }

  send_request({'url':req_url,
                'method':req_method,
                'headers':req_headers,
                'body_type':req_body_type,
                'body':data,
                'resp_encode':resp_encode},function(err,resp,body){

    var respmeta = meta;
    Object.keys(respmeta).forEach((k)=>{
      if(k.startsWith('_')){delete respmeta[k];}
    });

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

  });
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

  if(prm.method.toLowerCase()=='post' || prm.method.toLowerCase()=='put')
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

  options.encoding = (prm.resp_encode == 'binary')?null:'utf8';

  request(options, function (err, resp, body) {
    if (!err) {
      cb(err, resp, body);
    }else{
      cb(new Error("request error"));
    }
  });

}

module.exports = perform_function;
