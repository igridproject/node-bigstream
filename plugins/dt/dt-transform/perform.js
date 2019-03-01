var vm = require('vm');
var ctx = require('../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param;
  var memstore = context.task.memstore

  var in_type = request.input_type;
  var in_data = request.data;
  var in_meta = request.meta;

  var mapscr = Utils.parse_script_param(param.script);
  var datascr = param.text ;
  var ba64script = param.ba64script;

  if(datascr){
    mapscr = mapscr + "; data=`" + datascr + "`";
  }

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

  var context = new vm.createContext(mapenv);

  if(ba64script && typeof ba64script == 'string'){
    var strScript = Buffer.from(ba64script, 'base64').toString('utf8');
    var b64s = new vm.Script(strScript);
    b64s.runInContext(context);
  }
 
  var script = new vm.Script(mapscr);
  script.runInContext(context);

  var data = mapenv.data;
  var meta = mapenv.meta;
  var output_type = mapenv.type;

  if(param.to_binary && typeof data == 'string'){
    data = Buffer.from(data, 'base64');
    output_type = 'binary';
  }

  response.success(data,{'meta':meta,'output_type':output_type});


}

module.exports = perform_function;
