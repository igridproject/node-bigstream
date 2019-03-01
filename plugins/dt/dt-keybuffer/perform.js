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

  var out_data = {};
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
    prm_name = 'keybuffer-' + name_env.name_posfix;
  }

//keydata
  var datakey = '_def';

  if(param.key){
    var env = {
      'type' : output_type,
      'data' : data,
      'meta' : meta,
      'key' : '_def'
    }

    var script = new vm.Script("key=`" + param.key + "`");
    var context = new vm.createContext(env);
    script.runInContext(context);

    datakey = env.key;
    if(!datakey || datakey==''){datakey='_def'}
  }

  //flush_if
  var flush = false;
  if(meta['_flush'] && meta['_flush'].toString()=='true'){flush = true}
  if(param.flush_if && param.flush_if!=''){
    var env = {
      'type' : output_type,
      'data' : data,
      'meta' : meta,
      'flush':false
    }

    var script = new vm.Script("flush=(" + param.flush_if + ")?true:false");
    var context = new vm.createContext(env);
    script.runInContext(context);

    flush = (env.flush==true)?true:false;
  }

  if(typeof data == 'object' && data instanceof Buffer)
  {
    data = null;
  }


  memstore.getItem(prm_name,function(err,value){
    if(err){return response.error("memstore error");}

    var kbuffer = {};
    if(value && flush==false)
    {
      kbuffer = value;
    }
    kbuffer[datakey] = data;
    out_data = kbuffer;
    memstore.setItem(prm_name,kbuffer,function(err){})
    response.success(out_data,{'meta':meta,'output_type':output_type});

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
