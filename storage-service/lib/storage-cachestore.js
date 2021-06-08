var redis = require('redis');
const PREFIX = 'bs:cache:storage';

module.exports.create = function(conf)
{
  return new CacheStore(conf);
}

function CacheStore(conf){
  this.prefix = PREFIX ;

  if(conf.mem){
      this.mem = conf.mem;
  }else if(conf.conn){
    this.mem = redis.createClient(conf.conn);
  }
}

CacheStore.prototype.setIndex = function(storage,oid,object,cb){
  var key = this.prefix + ":" + storage;
  this.mem.hset(key,oid,object,cb);
}

CacheStore.prototype.getIndex = function(storage,oid,cb)
{
  var key = this.prefix + ":" + storage;
  this.mem.hget(key,oid,function(err,v){
    var value = null;
    if(!err && v){
      value = v;
    }
    cb(err,value);
  });
}

CacheStore.prototype.flush = function(storage,cb)
{
  var key = this.prefix + ":" + storage;
  this.mem.del(key);
  if(typeof cb == 'function'){
    cb();
  }
}

