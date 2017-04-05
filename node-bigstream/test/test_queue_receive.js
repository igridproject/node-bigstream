var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var QueueReceiver = ctx.getLib('lib/amqp/queuereceiver');

var server = new QueueReceiver({
              url : amqp_cfg.url,
            });

server.set_execute_function(function(data,callback){
  console.log(data);
  callback();
});

server.start(function(err){
  console.log('server start');
})
