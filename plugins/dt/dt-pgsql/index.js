var util = require('util');
var DTPlugin = require('../dt-plugin');

function DTTask(context,request){
  DTPlugin.call(this,context,request);
  this.name = "pgsql";
  this.output_type = "";
}
util.inherits(DTTask,DTPlugin);

DTTask.prototype.perform  =  require('./perform');

module.exports = DTTask;
