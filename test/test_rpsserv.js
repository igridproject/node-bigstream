var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var rpcserver = ctx.getLib('lib/amqp/rpcserver');

var server = new rpcserver({
              url : "amqp://bigmaster.igridproject.info",
            });

server.set_remote_function(function(req,callback){
  var n = parseInt(req);
  console.log('REQUEST ' + req);
  setTimeout(function(){
            callback(null,n);
      },n);
})

server.start(function(err){
  console.log('server start');
})
