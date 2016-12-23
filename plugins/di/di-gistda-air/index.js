var util = require('util');
var DIPlugin = require('../di-plugin');

function DITask(context){
  DIPlugin.call(this,context);
  this.name = "gistda-air";
  this.output_type = "jsonobject";
}
util.inherits(DITask,DIPlugin);

DITask.prototype.execute  =  require('./execute');

module.exports = DITask;
