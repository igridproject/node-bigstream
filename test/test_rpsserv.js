var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var rpcserver = ctx.getLib('lib/amqp/rpcserver');

var server = new rpcserver({
              url : amqp_cfg.url,
              name : 'test_request'
            });

server.set_remote_function(function(req,callback){
  callback(null,{'cmd':req.command,'id':req.id});
})

server.start(function(err){
  console.log('server start');
})

