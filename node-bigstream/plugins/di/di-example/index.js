var util = require('util');
var DIPlugin = require('../di-plugin');

function DITask(context){
  DIPlugin.call(this,context);
  this.name = "http-request";
  this.output_type = "text";
}
util.inherits(DITask,DIPlugin);

DITask.prototype.execute  =  require('./execute');

module.exports = DITask;
