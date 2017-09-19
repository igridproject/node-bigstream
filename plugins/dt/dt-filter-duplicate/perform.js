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

  var prm_name = (param.name)?'dupkey-'+param.name:'dupkey';

  var datakey = data;

  if(param.key){
    var env = {
      'type' : output_type,
      'data' : data,
      'meta' : meta,
      'key' : data
    }

    var script = new vm.Script("key=`" + param.key + "`");
    var context = new vm.createContext(env);
    script.runInContext(context);

    datakey = env.key;
    data = env.data;
    meta = env.meta;
    output_type = env.type;
  }

  var hash_key = hash(datakey);
  memstore.getItem(prm_name,function(err,value){
    if(value && value==hash_key)
    {
      memstore.setItem(prm_name,hash_key,function(err){})
      response.reject();
    }else{
      memstore.setItem(prm_name,hash_key,function(err){})
      response.success(data,{'meta':meta,'output_type':output_type});
    }
  });

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
