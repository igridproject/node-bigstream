var request = require('request').defaults({ encoding: null });

function execute_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.task.memstore

  var output_type = 'text';
  var url = param.url;

  var reject = true;
  if(param.reject=='false'){reject=false;}

  var encode = 'utf8';
  if(param.encoding == 'binary'){
    encode = null;
    output_type = 'binary'
  }

  if(param.encoding=='json'){output_type='object'}

  request({'url':url, 'encoding':encode}, function (error, resp, body) {
    response.meta = {'_status_code':(error)?0:resp.statusCode,'_error':(error)?true:false}
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
