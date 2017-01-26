var Redis = require('ioredis');

module.exports.create = function(cfg,opt)
{
  var conn = new ConnectionContext(cfg,opt);
  return conn;
}

function ConnCtx(cfg,opt)
{
  this.config = cgf;
}

ConnCtx.prototype.getMemstore = function(opt)
{
  if(!this.redis){
    this.redis = new Redis(this.config.memstore.url);
  }

  return this.redis;
}
