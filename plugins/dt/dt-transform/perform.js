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

  if(param.text){
    mapscr = mapscr + "; data=`" + param.text + "`";
  }

  var mapenv = {
    'src' : {
      'type' : in_type,
      'data' : in_data,
      'meta' : in_meta
    },
    'type' : in_type,
    'data' : in_data,
    'meta' : in_meta
  }

  var script = new vm.Script(mapscr);
  var context = new vm.createContext(mapenv);
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
