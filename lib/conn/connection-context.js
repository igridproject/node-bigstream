var Redis = require('redis');

module.exports.create = function(cfg,opt)
{
  var conn = new ConnCtx(cfg,opt);
  return conn;
}

var ConnCtx = function ConnectionContext(cfg,opt)
{
  this.config = cfg;
}

ConnCtx.prototype.getMemstore = function(opt)
{
  if(!this.redis){
    this.redis = Redis.createClient(this.config.memstore.url);
  }

  return this.redis;
}

ConnCtx.prototype.getAmqpUrl = function()
{
  return this.config.amqp.url;
}
