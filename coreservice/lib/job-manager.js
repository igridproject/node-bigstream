var ctx = require('../../context');
var cfg = ctx.config;

var JobRegistry = ctx.getLib('lib/mems/job-registry');
var TriggerRegistry = ctx.getLib('lib/mems/trigger-registry');
var JUtils = ctx.getLib('lib/job/jobutils');

module.exports.create = function(cfg)
{
  return new JobManager(cfg);
}

function JobManager (cfg)
{
  this.config = cfg;
  this.conn = cfg.conn;
  this.mem = this.conn.getMemstore();
  this.job_registry = JobRegistry.create({'redis':this.mem});
  this.trigger_registry = TriggerRegistry.create({'redis':this.mem});
}

JobManager.prototype.listJob = function (prm,cb)
{
  var self = this;
  var param = prm;
  if(typeof prm == 'function')
  {
    cb = prm;
    param = {};
  }

  self.job_registry.listJob(function (err,jobs){
    if(jobs){
      cb(null,jobs);
    }else{
      cb(null,[]);
    }
  });
}

JobManager.prototype.getJob = function (prm,cb)
{
  var self = this;

  self.job_registry.getJob(prm.job_id,function (err,jobcfg){
    cb(err,jobcfg)
  })
}

JobManager.prototype.deleteJob = function (prm,cb)
{
  var self = this;
  var job_id = prm.job_id;

  self.trigger_registry.deleteByJobId(job_id,function(err){
    self.job_registry.deleteJob(job_id,cb);
  });
}

JobManager.prototype.setJob = function (prm,cb)
{
  var self = this;
  var job = prm.job;

  if(JUtils.validate(job)){
    self.job_registry.setJob(job.job_id,job);
    if(job.trigger){
      self.trigger_registry.setByJob(job,cb);
    }else{
      self.trigger_registry.deleteByJobId(job.job_id,cb);
    }
  }else{
    cb('Invalid job config');
  }
}
