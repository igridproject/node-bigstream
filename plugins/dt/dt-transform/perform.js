var vm = require('vm');
var ctx = require('../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var Register = ctx.getLib('jobworker/lib/mems-register');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param || {};
  var memstore = context.task.memstore

  var in_type = request.input_type;
  var in_data = request.data;
  var in_meta = request.meta || {};
  
  var mapenv = {
    'src' : {
      'type' : in_type,
      'data' : in_data,
      'meta' : in_meta
    },
    '_env':{},
    'type' : in_type,
    'data' : in_data,
    'meta' : in_meta
  }
  
  if(param.use_register){
    memstore.getItem('register',function(err,value){
      if(err){return response.error("memstore error");}

      mapenv.register = Register.create(value);
    
      mapenv = _compile(mapenv,param);
      memstore.setItem('register',mapenv.register.get(),function(err){
        _response();
      });
    });
  }else{
    mapenv = _compile(mapenv,param);
    _response();
  }

  function _response()
  {
    var data = mapenv.data;
    var meta = mapenv.meta;
    var output_type = mapenv.type;

    if(param.to_binary && typeof data == 'string'){
      data = Buffer.from(data, 'base64');
      output_type = 'binary';
    }

    response.success(data,{'meta':meta,'output_type':output_type});
  }
  

}

function _compile(mape,param)
{
  var mapenv = mape;

  var mapscr = Utils.parse_script_param(param.script);
  var datascr = param.text ;
  var ba64script = param.ba64script;

  if(datascr){
    mapscr = mapscr + "; data=`" + datascr + "`";
  }

  var context = new vm.createContext(mapenv);

  if(ba64script && typeof ba64script == 'string'){
    var strScript = Buffer.from(ba64script, 'base64').toString('utf8');
    var b64s = new vm.Script(strScript);
    b64s.runInContext(context);
  }
 
  var script = new vm.Script(mapscr);
  script.runInContext(context);

  return mapenv;
}

module.exports = perform_function;
