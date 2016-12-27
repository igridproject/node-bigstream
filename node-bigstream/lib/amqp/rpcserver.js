var amqp = require('amqplib/callback_api');

function RPCServer(config)
{
    this.config = config;
    this.url = config.url;
    this.name = config.name || "rpc_queue";
    this.remote_function = null;
}

RPCServer.prototype.start = function(cb)
{
  var self = this;
  amqp.connect(self.url, function(err, conn) {
    if(err){
      return cb(err);
    }
    conn.createChannel(function(err, ch) {
      if(err){
        return cb(err);
      }
      var q = self.name;

      ch.assertQueue(q, {durable: false});
      ch.prefetch(1);
      //console.log(' [x] Awaiting RPC requests');

      ch.consume(q, function reply(msg) {
        var req = JSON.parse(msg.content.toString());

        self.remote_function(req,function(err,resp){
          ch.sendToQueue(msg.properties.replyTo,new Buffer(JSON.stringify(resp)),{correlationId: msg.properties.correlationId});

        });
        ch.ack(msg);
      });
      cb(null);

    });
  });
}

RPCServer.prototype.set_remote_function = function(func){
  this.remote_function = func;
}

module.exports = RPCServer;
