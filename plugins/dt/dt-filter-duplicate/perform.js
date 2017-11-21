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

//keyname
  //var prm_name = (param.name)?'dupkey-'+param.name:'dupkey';
  var prm_name = 'dupkey';
  if(param.name){
    var name_env = {
      'type' : output_type,
      'data' : data,
      'meta' : meta,
      'name_posfix' : ''
    }
    var nscript = new vm.Script("name_posfix=`" + param.name + "`");
    var ncontext = new vm.createContext(name_env);
    nscript.runInContext(ncontext);
    prm_name = 'dupkey-' + name_env.name_posfix;
  }

//keydata
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
