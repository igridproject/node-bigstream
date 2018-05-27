var vm = require('vm');
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
  var message = data;
  var image_url = null;

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta,
    'msg' : data,
    'img' : null
  }
  var txt_script = ""

  if(param.image_url){
    env.msg="";
    txt_script += "img=`" + param.image_url + "`; "
  }
  if(param.message){txt_script += "msg=`" + param.message + "`; "}

  var script = new vm.Script(txt_script);
  var context = new vm.createContext(env);
  script.runInContext(context);

  message = (typeof env.msg == 'string')?env.msg:JSON.stringify(env.msg);
  image_url = env.img;

  post_to_line(token,message,{'imgurl':image_url},function(err){
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

function post_to_line(token,msg,resource,cb)
{

  var options = { method: 'POST',
    url: 'https://notify-api.line.me/api/notify',
    headers:
     { 'cache-control': 'no-cache',
       'authorization' : 'Bearer ' + token,
       'content-type': 'multipart/form-data' },
    formData: {
      message: String(msg)
    }
  };

  if(typeof resource == 'function')
  {
    cb=resource;
  }else {
    if(resource.imgurl){
      options.formData.imageThumbnail = resource.imgurl;
      options.formData.imageFullsize = resource.imgurl;
    }
  }

  request(options, function (err, resp, body) {
    if (!err && resp.statusCode==200) {
      var r = JSON.parse(body);
      if(r.status==200){
        cb();
      }else{
        cb(new Error("line send error"));
      }
    }else{
      cb(new Error("line error"));
    }
  });

}

module.exports = perform_function;
