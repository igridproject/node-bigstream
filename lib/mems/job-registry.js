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
    cb(err,JSON.parse(data));
  });
}
