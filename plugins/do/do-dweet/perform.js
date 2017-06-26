var request = require("request");

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta;

  var thing = param.thing;

  post_to_dweet({'thing':thing,'data':data},function(err){
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

function post_to_dweet(prm,cb)
{

  var thing = prm.thing;
  var data = prm.data;
  var key = prm.key;
  var options = {
    'method': 'POST',
    'url': 'https://dweet.io/dweet/for/' + thing,
    'headers':
     { 'cache-control': 'no-cache',
       'content-type': 'application/json' },
    'body': data,
    'json':true
  };

  request(options, function (err, resp, body) {
    if (!err && resp.statusCode==200) {
      var r = body;
      if(r.this=='succeeded'){
        cb();
      }else{
        cb(new Error("dweet send error"));
      }
    }else{
      cb(new Error("dweet error"));
    }
  });

}

module.exports = perform_function;
