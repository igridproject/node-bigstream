var ctx = require('../../../context');
var bsdata = ctx.getLib('lib/model/bsdata');

function perform_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param || {};
  var memstore = context.task.memstore;
  var input_data = context.input.data;
  var input_meta = context.input.meta || {};
  var output_type = 'object'
  var data = input_data;


  if(param.object == 'httpdata')
  {
    if(data.object_type && data.object_type == 'httpdata'){
      var htdata = data; 
      input_meta.method = htdata.method;
      if(param.http_headers){
        input_meta.http_headers = htdata.http_headers
      }
      if(typeof htdata.data == 'object' && htdata.data.type == 'Buffer'){
        data = Buffer.from(htdata.data);
      }else{
        data = htdata.data;
      }
    }
  }
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });


  response.success(data,{'meta':input_meta,'output_type':output_type});
  //response.reject();
  //response.error("error message")

}

// function extract_httpdata(dat)
// {
//   if(dat.object_type && dat.object_type == 'httpdata'){
//     return dat.data;
//   }else{
//     return dat;
//   }
// }


module.exports = perform_function;
