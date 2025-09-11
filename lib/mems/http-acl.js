var Redis = require('redis');
const PREFIX = 'bs:http:acl';
const KEYS = 'bs:regis:triggers';

module.exports.create = function(cfg)
{
  return new HttpACL(cfg);
}

module.exports.mkACL = mkACL;
function mkACL(appkey,method,jobid,opt)
{
  var a = {
    'appkey' : appkey,
    'method' : method,
    'jobid' : jobid
  }
  if(opt){a.opt = opt}
  return a;
}

function HttpACL(cfg)
{
  this.config = cfg;

  if(cfg.conn){
    this.mem = Redis.createClient(cfg.conn);
  }else if(cfg.redis){
    this.mem = cfg.redis;
  }else{
    this.mem = null;
  }

  this.acl = [];
}

HttpACL.prototype.add = function(acl)
{
  var found = false;
  this.acl.forEach( function (val) {
    if(val.appkey == acl.appkey && val.method == acl.method && val.jobid == acl.jobid){
      found = true;
    }
  });

  if(!found){
    this.acl.push(acl);
  }
}

HttpACL.prototype.clean = function()
{
  this.acl = [];
}

HttpACL.prototype.update = function(cb)
{
  var self=this;
  self.clean()
  self.mem.hgetall(KEYS,function (err,res){
    if(!err && res){

      var ks = Object.keys(res);
      for(var i=0;i<ks.length;i++)
      {
        var k = ks[i];
        var trigger = JSON.parse(res[k]);
        if(trigger.type == 'http')
        {
          var _vo = trigger.vo || '';
          var akey = (_vo=='$' || _vo=='')?trigger.appkey:_vo + '.' + trigger.appkey;
          var vopt = trigger.opt || trigger.param || {}
          var acl = mkACL(akey,trigger.method,trigger.job_id,vopt);
          self.add(acl);
        }
      }
    }

    cb(err);
  });
}

HttpACL.prototype.findJob= function(appkey,method)
{
  var jobs = [];
  this.acl.forEach( function (val) {
    if(val.appkey == appkey && val.method == method){
      jobs.push(val);
    }
  });

  return jobs;
}
