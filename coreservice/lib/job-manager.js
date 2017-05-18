var ctx = require('../../context');
var cfg = ctx.config;

var JobRegistry = ctx.getLib('lib/mems/job-registry');
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

  self.job_registry.getJob(prm.jid,function (err,jobcfg){
    cb(err,jobcfg)
  })

}
