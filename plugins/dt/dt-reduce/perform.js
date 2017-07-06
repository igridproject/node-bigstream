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

  var init_scr = Utils.parse_script_param(param.init);
  var red_scr = Utils.parse_script_param(param.script);

  var red_data = (Array.isArray(in_data))?in_data:[in_data];
  var out_data = {};

  var initenv = {
    'src' : {
      'type' : in_type,
      'data' : in_data,
      'meta' : in_meta
    },
    'data' : {}
  }
  var init_script = new vm.Script(init_scr);
  init_script.runInContext(new vm.createContext(initenv));

  var script = new vm.Script(red_scr);
  out_data = red_data.reduce(function(memo,item,index){
    var env = {
      'src' : {
        'data' : item,
        'meta' : in_meta,
        'type' : in_type
      },
      'index':index,
      'item' : item,
      'data' : memo
    }
    var context = new vm.createContext(env);
    script.runInContext(context);
    return env.data;
  },initenv.data);


  response.success(out_data,{'meta':in_meta,'output_type':in_type});

}



module.exports = perform_function;
