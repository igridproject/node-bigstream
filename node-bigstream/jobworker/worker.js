var ctx = require('../context');
var cfg = ctx.config;

var QueueReceiver = ctx.getLib('lib/amqp/queuereceiver');

module.exports.create = function(prm)
{
  var jw = new JW(prm);
  return jw;
}

var JW = function JobWorker (prm)
{
  var param = prm || {};
  this.config = param.config || cfg;
  this.instance_name = param.name;

}
