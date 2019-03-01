var vm = require('vm');
var hash = require('object-hash');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta;

  var reject=false;
  if(param.condition && param.condition!=''){
    var env = {
      'type' : output_type,
      'data' : data,
      'meta' : meta,
      'response':false
    }

    var script = new vm.Script("response=(" + param.condition + ")?true:false");
    var context = new vm.createContext(env);
    script.runInContext(context);

    reject = (env.response==true)?true:false;
  }

  if(!reject)
  {
    response.success(data,{'meta':meta,'output_type':output_type});
  }else{
    response.reject();
  }

  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });

  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
