var util = require('util');
var DIPlugin = require('../di-plugin');

function DITask(){
  this.name = "http"
}
util.inherits(DITask,DIPlugin);

DITask.prototype.execute  =  require('./execute');

module.exports = DITask;
