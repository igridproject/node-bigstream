const NodeCache = require( "node-cache" )

module.exports.create = function(prm)
{
  return new BSSCache(prm);
}

function BSSCache(prm={}){
    this.defTTL = prm.TTL || 600
    this.max_size = prm.max_size || 8 * 1024 *1024
    this.cache = new NodeCache({stdTTL:this.defTTL})
}


BSSCache.prototype.setCache = function (prm,obj)
{
    let sname = prm.s
    let ktype = prm.t || 'seq'
    let keyname = prm.k
    let ver = prm.v || '0'
    let osize = prm.z

    let cachekey = sname + ':' + ktype + ':' + String(keyname) + ':' + String(ver)
    if(!obj){return;}
    if(osize && osize>this.max_size){
        return;
    }

    this.cache.set(cachekey,obj);
}

BSSCache.prototype.getCache = function (prm)
{
    let sname = prm.s || '.'
    let ktype = prm.t || 'seq'
    let keyname = prm.k
    let ver = prm.v || '0'

    let cachekey = sname + ':' + ktype + ':' + String(keyname) + ':' + String(ver)

    let val = this.cache.get(cachekey)

    if(!val){
        return null
    }

    this.cache.ttl(cachekey)

    return val
}