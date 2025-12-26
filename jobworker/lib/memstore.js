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
  var value = JSON.stringify(v);
  this.mem.set(key,value,cb);
}

memstore.prototype.setItemKey = function(k,v,cb){
  var key = k;
  var value = JSON.stringify(v);
  this.mem.set(key,value,cb);
}

memstore.prototype.setHash = function(h,k,v,cb){
  var key = this.prefix + ":" + k;
  var value = JSON.stringify(v);
  this.mem.hset(h,key,value,cb);
}

memstore.prototype.setHashKey = function(h,k,v,cb){
  var key = k;
  var value = JSON.stringify(v);
  this.mem.hset(h,key,value,cb);
}

memstore.prototype.getItem = function(k,cb)
{
  var key = this.prefix + ":" + k;
  this.mem.get(key,function(err,v){
    var value = null;
    if(!err && v){
      if(typeof v == 'object' && v.type == 'Buffer')
      {
        value = Buffer.from(v.data);
      }else{
        value = JSON.parse(v);
      }
    }
    cb(err,value);
  });
}

memstore.prototype.getItemKey = function(k,cb)
{
  var key = k;
  this.mem.get(key,function(err,v){
    var value = null;
    if(!err && v){
      if(typeof v == 'object' && v.type == 'Buffer')
      {
        value = new Buffer(v.data);
      }else{
        value = JSON.parse(v);
      }
    }
    cb(err,value);
  });
}

memstore.prototype.getHashKey = function(h,cb)
{
  this.mem.hkeys(h,function(err,v){
    var value = null;
    if(!err && v){
      value = v
    }
    cb(err,v);
  });
}

memstore.prototype.getHash = function(h,k,cb)
{
  this.mem.hget(h,k,function(err,v){
    var value = null;
    if(!err && v !== undefined){
      value = JSON.parse(v)
    }
    cb(err,value);
  });
}

module.exports = memstore;
