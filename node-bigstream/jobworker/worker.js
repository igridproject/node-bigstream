var ctx = require('../context');
var cfg = ctx.config;

var QueueReceiver = ctx.getLib('lib/amqp/queuereceiver');
var ConnCtx = ctx.getLib('lib/conn/connection-context');
var JobRegistry = ctx.getLib('lib/mems/job-registry');

var JobTransaction = require('./lib/jobtransaction')
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

  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore()
  this.job_registry = JobRegistry.create({'redis':this.mem});
}

JW.prototype.start = function ()
{
  this.amqp_job_start();
}

JW.prototype.amqp_job_start = function ()
{
  var self=this;
  if(self.amqp_server){return;}

  self.amqp_server = new QueueReceiver({
                url : self.conn.getAmqpUrl(),
                name : 'bs_jobs_queue'
              });

  self.amqp_server.set_execute_function(function(data,callback){
    var jt = new JobTransaction({'handle':self,'cmd':data});
    jt.run(function(err){
      if(err){
        console.log(err);
      }
      callback();
    });

  });

  self.amqp_server.start(function(err){
    console.log('worker start');
  })

}
