var Redis = require('redis');
var mmatch = require("minimatch");

const KEYS = 'bs:regis:triggers';

module.exports.create = function(cfg)
{
  return new StorageEventList(cfg);
}

module.exports.mkSEL = mkSEL;
function mkSEL(storage_name,jobid,opt)
{
  var a = {
    'storage_name' : storage_name,
    'jobid' : jobid
  }
  if(opt){a.opt = opt}
  return a;
}

function StorageEventList(cfg)
{
  this.config = cfg;

  if(cfg.conn){
    this.mem = Redis.createClient(cfg.conn);
  }else if(cfg.redis){
    this.mem = cfg.redis;
  }else{
    this.mem = null;
  }

  this.sel = [];
}

StorageEventList.prototype.add = function(sel)
{
  var found = false;
  this.sel.forEach( function (val) {
    if(val.storage_name == sel.storage_name && val.jobid == sel.jobid){
      found = true;
    }
  });

  if(!found){
    this.sel.push(sel);
  }
}

StorageEventList.prototype.clean = function()
{
  this.sel = [];
}

StorageEventList.prototype.update = function(cb)
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
        if(trigger.type == 'storage')
        {
          var sel = mkSEL(trigger.storage_name,trigger.job_id);
          self.add(sel);
        }
      }
    }

    cb(err);
  });
}

StorageEventList.prototype.findJob= function(sname)
{
  var jobs = [];
  // this.sel.forEach( function (val) {
  //   if(val.storage_name == sname){
  //     jobs.push(val);
  //   }
  // });
  this.sel.forEach( function (val) {
    if(mmatch(sname,val.storage_name)){
      jobs.push(val);
    }
  });

  return jobs;
}
