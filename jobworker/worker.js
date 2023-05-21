var ctx = require('../context');
var cfg = ctx.config;

var QueueCaller = ctx.getLib('lib/amqp/queuecaller');
var QueueReceiver = ctx.getLib('lib/amqp/queuereceiver');
var EvenPub = ctx.getLib('lib/amqp/event-pub');
var ConnCtx = ctx.getLib('lib/conn/connection-context');
var JobRegistry = ctx.getLib('lib/mems/job-registry');
//var SSCaller = ctx.getLib('lib/axon/rpccaller');
var RPCCaller = ctx.getLib('lib/amqp/rpccaller');
var ACLValidator = ctx.getLib('lib/auth/acl-validator');

var JobTransaction = require('./lib/jobtransaction')

//const SS_URL = 'tcp://127.0.0.1:19030'
var SS_URL = ctx.getUnixSocketUrl('ss.sock');
module.exports.create = function(prm)
{
  var jw = new JW(prm);
  return jw;
}

var JW = function JobWorker (prm)
{
  var param = prm || {};
  this.config = param.config || cfg;
  this.auth_cfg = this.config.auth;
  this.instance_name = param.name;

  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore();

  this.jobcaller = new QueueCaller({'url':this.conn.getAmqpUrl(),'name':'bs_jobs_cmd'});
  this.msgsender = new EvenPub({'url':this.conn.getAmqpUrl(),'name':'bs_msg_bus'});
  this.job_registry = JobRegistry.create({'redis':this.mem});
  this.acl_validator = ACLValidator.create(this.auth_cfg);

  /* Disable RPC Feature */
  //this.storagecaller = new SSCaller({'url':SS_URL});
  this.storagecaller = new RPCCaller({
    url : this.conn.getAmqpUrl(),
    name :'storage_request'
  });
}

JW.prototype.start = function ()
{
  this.amqp_pmr_start();
  this.amqp_snd_start();
}

JW.prototype.amqp_pmr_start = function ()
{
  var self=this;
  if(self.amqp_server_pmr){return;}

  if(!self.QCaller){
    self.QCaller = new QueueCaller({'url':self.conn.getAmqpUrl(),'name':'bs_jobs_queue'});
  }

  self.amqp_server_pmr = new QueueReceiver({
                url : self.conn.getAmqpUrl(),
                name : 'bs_jobs_cmd'
              });

  self.amqp_server_pmr.set_execute_function(function(data,callback){
    if(data.option && data.option.exe_level && data.option.exe_level=='secondary')
    {
      console.log('WORKER:Forward job[' + data.jobId + '] to SJW');
      self.QCaller.send(data);
    }else{
      self._execute_job(data,function (err) {

      });
    }
    callback();
  });

  self.amqp_server_pmr.start(function(err){
    if(err){
      console.log('WORKER:AMQP ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }else{
      console.log('WORKER:Primary Start\t\t[OK]');
    }
  })

}

JW.prototype.amqp_snd_start = function ()
{
  var self=this;
  if(self.amqp_server_snd){return;}

  self.amqp_server_snd = new QueueReceiver({
                url : self.conn.getAmqpUrl(),
                name : 'bs_jobs_queue'
              });

  self.amqp_server_snd.set_execute_function(function(data,callback){
    self._execute_job(data,callback);
  });

  self.amqp_server_snd.start(function(err){
    if(err){
      console.log('WORKER:AMQP ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }else{console.log('WORKER:Secondary Start\t\t[OK]');}

  })

}

JW.prototype._execute_job = function (data,callback)
{
  var self=this;
  var jt = new JobTransaction({'handle':self,'cmd':data});
  jt.run(function(err){
    if(err){
      console.log(err);
    }
    callback();
  });
}
