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

  var map_data = (Array.isArray(in_data))?in_data:[in_data];
  var out_data = [];

  var script = new vm.Script(mapscr);
  map_data.forEach(function(dat){
    var env = {
      'src' : {
        'data' : dat,
        'meta' : in_meta,
        'type' : in_type
      },
      'data' : dat
    }
    var context = new vm.createContext(env);
    script.runInContext(context);
    out_data.push(env.data)
  });


  response.success(out_data,{'meta':in_meta,'output_type':in_type});

}



module.exports = perform_function;
