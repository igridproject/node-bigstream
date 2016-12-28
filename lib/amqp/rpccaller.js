var amqp = require('amqplib/callback_api');

function RPCCaller(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "rpc_queue";
}

RPCCaller.prototype.call = function(req,cb){
  var self = this;
  amqp.connect(self.url, function(err, conn) {
    conn.createChannel(function(err, ch) {
      ch.assertQueue('', {exclusive: true}, function(err, q) {
        var corr = generateUuid();

        ch.consume(q.queue, function(msg) {
          if (msg.properties.correlationId == corr) {
            var resp = JSON.parse(msg.content.toString());
            conn.close();
            cb(null,resp);
          }
        }, {noAck: true});

        ch.sendToQueue(self.name,
        new Buffer(JSON.stringify(req)),
        { correlationId: corr, replyTo: q.queue });
      });
    });
  });

  function generateUuid() {
    return Math.random().toString() +
           Math.random().toString() +
           Math.random().toString();
  }
}

module.exports = RPCCaller;
