var util = require('util');
var DIPlugin = require('../di-plugin');

function DITask(context){
  DIPlugin.call(this,context);
  this.name = "http"
}
util.inherits(DITask,DIPlugin);

DITask.prototype.execute  =  require('./execute');

module.exports = DITask;
