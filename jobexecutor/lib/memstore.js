var redis = require('redis');
const PREFIX = 'bs:jobs';

function memstore(conf){
  this.prefix = PREFIX + ':' + conf.job_id + ':' + conf.cat;

  if(conf.mem){
      this.mem = conf.mem;
  }else if(conf.conn){
    this.mem = redis.createClient(conf.conn);
  }
}

memstore.prototype.setItem = function(k,v,cb){
  var key = this.prefix + ":" + k;
  this.mem.set(key,v,cb);
}

memstore.prototype.getItem = function(k,cb)
{
  var key = this.prefix + ":" + k;
  this.mem.get(key,cb);
}

module.exports = memstore;
