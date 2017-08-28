var util = require('util');
var DOPlugin = require('../do-plugin');

function DOTask(context,request){
  DOPlugin.call(this,context,request);
  this.name = "pgsql";
}
util.inherits(DOTask,DOPlugin);

DOTask.prototype.perform  =  require('./perform');

module.exports = DOTask;
