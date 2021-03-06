var amqp = require('amqplib/callback_api');
var EventEmitter = require('events').EventEmitter;
var thunky = require('thunky');

const REPLY_QUEUE = 'amq.rabbitmq.reply-to';
function RPCCaller(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "rpc_queue";

  this.conn = null;
  this.ch = null;

  var self = this;

  this.opened = false;
  this.open = thunky(open);
  this.open();

  function open (cb) {
    amqp.connect(self.url, function(err, conn) {
      if (err){return cb(err)}
      conn.createChannel(function(err, ch) {
        if (err){return cb(err)}
        
        ch.responseEmitter = new EventEmitter();
        ch.responseEmitter.setMaxListeners(0);
        ch.prefetch(4);
        ch.consume(REPLY_QUEUE ,
          (msg) => { ch.responseEmitter.emit(msg.properties.correlationId, JSON.parse(msg.content.toString()))},
          {noAck: true});

        self.opened = true;
        self.conn = conn;
        self.ch = ch;

        cb();
      });
    });
  }
}

RPCCaller.prototype.call = function(req,cb){
  var self = this;
  var corr = generateUuid();
  self.open(function(err){
    if(err){
      console.log(err);
    }
    self.ch.responseEmitter.once(corr, (resp)=>{
      cb(null,resp);
    });
    self.ch.sendToQueue(self.name, Buffer.from(JSON.stringify(req)), { correlationId: corr, replyTo: REPLY_QUEUE,persistent: false })
  });

  function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
  }
}

module.exports = RPCCaller;
