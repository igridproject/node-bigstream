function memstore(pref,storage){
  this.prefix = pref;
  this.storage = storage;
}

memstore.prototype.setItem = function(k,v,cb){
  var key = this.prefix + "." + k;
  this.storage.setItem(key,v,cb);
}

memstore.prototype.getItem = function(k,cb)
{
  var key = this.prefix + "." + k;
  this.storage.getItem(key,cb);
}

module.exports = memstore;
