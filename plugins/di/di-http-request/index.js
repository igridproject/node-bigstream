var util = require('util');
var DIPlugin = require('../di-plugin');

function DITask(){

}
util.inherits(DITask,DIPlugin);

DITask.prototype.execute = execute_function;

var execute_function = function(ctx,out){
  var job_id = ctx.profile.jobid;
  var transaction_id = ctx.profile.transaction_id;
  var param = ctx.parameter;

}


module.exports = DITask;
