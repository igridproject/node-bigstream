var redis = require('redis');
const PREFIX = 'bs:scheduler:cronlist';
const KEYS = 'bs:regis:triggers';

module.exports.create = function(cfg)
{
  return new CronList(cfg);
}

module.exports.mkCron = function(name,cmd,jobid,opt)
{
  var a = {
    'name' : name,
    'cmd' : cmd,
    'jobid' : jobid
  }
  if(opt){a.opt = opt}
  return a;
}

function CronList(cfg)
{
  this.config = cfg;

  if(cfg.conn){
    this.mem = redis.createClient(cfg.conn);
  }else if(cfg.redis){
    this.mem = cfg.redis;
  }else{
    this.mem = null;
  }

  this.list = [];
}

CronList.prototype.add = function(cron)
{
  var found = false;
  this.list.forEach( function (val) {
    if(val.name == cron.name){
      found = true;
    }
  });

  if(!found){
    this.list.push(cron);
  }
}

CronList.prototype.clean = function()
{
  this.list = [];
}

CronList.prototype.update = function(cb)
{
  var self=this;
  // this.mem.get(PREFIX, function (err, result) {
  //   if(!err && result){
  //     self.list = JSON.parse(result);
  //   }
  //   cb(err);
  // });
  self.list = [];
  self.mem.hgetall(KEYS,function (err,res){
    if(!err && Array.isArray(res)){
      var ks = Object.keys(res);
      for(var i=0;i<ks.length;i++)
      {
        var k = ks[i];
        var trigger = JSON.parse(res[k]);
        if(trigger.type == 'cron')
        {
          var cl = self.mkCron(trigger.id,trigger.cmd,trigger.job_id);
          self.list.push(cl);
        }
      }
    }
    cb(err);
  });

}

CronList.prototype.commit = function(cb)
{
  var strlist = JSON.stringify(this.list);
  this.mem.set(PREFIX,strlist);

  if(typeof cb == 'function'){
    cb();
  }
}

CronList.prototype.getList = function()
{
  return this.list;
}
