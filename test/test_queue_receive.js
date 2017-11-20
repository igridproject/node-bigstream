var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;
var AMQP_URL = 'amqp://bigmaster.igridproject.info';

var QueueReceiver = ctx.getLib('lib/amqp/queuereceiver');

var server = new QueueReceiver({
              url : AMQP_URL,
              name : 'bs_jobs_queue'
            });

server.set_execute_function(function(data,callback){
  console.log(data);
  callback();
});

server.start(function(err){
  console.log('server start');
})
