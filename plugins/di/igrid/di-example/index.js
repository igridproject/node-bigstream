var util = require('util');
var DIPlugin = require('../../di-plugin');

function DITask(context){
  DIPlugin.call(this,context);
  this.name = "igrid.example";
  this.output_type = "text";
}
util.inherits(DITask,DIPlugin);

DITask.prototype.perform  =  require('./perform');

module.exports = DITask;
