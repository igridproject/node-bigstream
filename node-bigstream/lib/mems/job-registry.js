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
  this.mem.set(jobKey,strjob,cb);

  // if(typeof cb == 'function'){
  //   cb();
  // }

}

JobRegistry.prototype.deleteJob = function(jobid,cb)
{
  var self = this;
  var jobKey = PREFIX + ':' + jobid;

  this.mem.del(jobKey,cb);

}

JobRegistry.prototype.listJob = function(cb)
{
  var self = this;
  var jobKeys = PREFIX + ':*';

  this.mem.keys(jobKeys,function(err,keys){
    if(err || !keys){return cb(err,null);}
    var arr =[];
    for(var i = 0, len = keys.length; i < len; i++) {
      arr.push(keys[i].split(':')[3]);
    }
    cb(err,arr);
  });
}
