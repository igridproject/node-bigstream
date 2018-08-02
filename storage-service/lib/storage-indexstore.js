var redis = require('redis');
const PREFIX = 'bs:storage:index';

function indexstore(conf){
  this.prefix = PREFIX ;

  if(conf.mem){
      this.mem = conf.mem;
  }else if(conf.conn){
    this.mem = redis.createClient(conf.conn);
  }
}

indexstore.prototype.setIndex = function(storage,keyname,value,cb){
  var key = this.prefix + ":" + storage;
  this.mem.hset(key,keyname,value,cb);
}

indexstore.prototype.getIndex = function(storage,keyname,cb)
{
  var key = this.prefix + ":" + storage;
  this.mem.hget(key,keyname,function(err,v){
    var value = null;
    if(!err && v){
      //value = JSON.parse(v);
      value = v;
    }
    cb(err,value);
  });
}

indexstore.prototype.flush = function(storage,cb)
{
  var key = this.prefix + ":" + storage;
  this.mem.del(key);
  if(typeof cb == 'function'){
    cb();
  }
}

module.exports = indexstore;
