var redis = require('redis');
const KEYS = 'bs:regis:triggers';

module.exports.create = function(cfg)
{
  return new TR(cfg);
}

var TR = function TriggerRegistry(cfg)
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

TR.prototype.setTrigger = function(name,trigger,cb)
{
  var self = this;
  var strTrigger = JSON.stringify(trigger);
  self.mem.hset(KEYS,name,strTrigger);

  if(typeof cb == 'function'){
    cb();
  }
}

TR.prototype.setByJob = function(job,cb)
{
  var self = this;
  var id = 'def.' + job.job_id;
  var trigger = job.trigger;
  trigger.id = id;
  trigger.job_id = job.job_id;
  self.setTrigger(id,trigger,cb);
}

TR.prototype.clear = function (cb)
{
  self.mem.del(KEYS);
  if(typeof cb == 'function'){
    cb();
  }
}
