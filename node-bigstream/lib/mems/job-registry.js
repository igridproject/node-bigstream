var redis = require('redis');
const PREFIX = 'bs:regis:jobs';

module.exports.create = function(cfg)
{
  return new JobRegistry(cfg);
}

function JobRegistry(cfg)
{
  this.config = cfg;

  if(cfg.conn){
    this.mem = redis.createClient(cfg.conn);
  }else if(cfg.redis){
    this.mem = cfg.redis;
  }else{
    this.mem = null;
  }
}

JobRegistry.prototype.getJob = function(jobid,cb)
{
  var self = this;
  var jobKey = PREFIX + ':' + jobid;

  this.mem.get(jobKey,function(err,data){
    if(err || !data)
    {
      return cb(err,null);
    }

    cb(err,JSON.parse(data));
  });
}

JobRegistry.prototype.setJob = function(jobid,job,cb)
{
  var self = this;
  var jobKey = PREFIX + ':' + jobid;
  var strjob = JSON.stringify(job);
  this.mem.set(jobKey,strjob);

  if(typeof cb == 'function'){
    cb();
  }

}
