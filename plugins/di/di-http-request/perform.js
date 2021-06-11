var vm = require('vm');
var request = require('request').defaults({ encoding: null });

function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.task.memstore
  var input_data = context.input.data;
  var input_meta = context.input.meta;

  var output_type = 'text';
  var url = param.url;
  var env = {
    'input' : {
      'meta' : input_meta,
      'data' : input_data
    },
    'url' : ''
  }

  var script = new vm.Script("url=`" + url + "`");
  var context = new vm.createContext(env);
  script.runInContext(context);

  url = env.url;


  var reject = true;
  if(typeof param.reject != 'undefined' && param.reject.toString()=="false"){reject=false;}

  var encode = 'utf8';
  if(param.encoding == 'binary'){
    encode = null;
    output_type = 'binary'
  }

  if(param.encoding=='json'){output_type='object'}

//Http Header
  var http_headers = {};
  if(param.auth){
    if(param.auth.type == 'basic'){
      var auth_header  = "Basic " + Buffer.from(param.auth.username + ":" + param.auth.password).toString("base64");
      http_headers.Authorization = auth_header;
    }
  }

  if(typeof param.headers == 'object')
  {
    http_headers = Object.assign(http_headers,param.headers)
  }

  request({'method': 'GET','url':url,'headers':http_headers ,'encoding':encode}, function (error, resp, body) {
    var respmeta = {};
    //response.meta = {'_status_code':(error)?0:resp.statusCode,'_error':(error)?true:false}

    //Merg Input Meta
    if(input_meta && typeof input_meta == 'object')
    {
      Object.keys(input_meta).forEach((item)=>{
        if(!item.startsWith('_')){
          respmeta[item] = input_meta[item];
        }
      });
    }

    respmeta['_status_code'] = (error)?0:resp.statusCode;
    respmeta['_error'] = (error)?true:false;
    response.meta = respmeta;

    if (!error && resp.statusCode == 200) {
      if(param.encoding=='json'){
        try{
          var j = JSON.parse(body);
          response.success(j,output_type);
        }catch(err){
          response.error(new Error('JSON Parsing Error'));
        }
      }else{
        response.success(body,output_type);
      }

    }else if(!reject){
      response.success(null,output_type);
    }else{
      response.reject();
    }
  });
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });


  //response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

module.exports = execute_function;
