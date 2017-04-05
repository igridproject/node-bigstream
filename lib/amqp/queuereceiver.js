var amqp = require('amqplib/callback_api');
var thunky = require('thunky');

function QueueReceiver(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "task_queue";
  this.execute_function = null;
}

QueueReceiver.prototype.start = function (cb)
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

      ch.assertQueue(q, {durable: true});
      ch.prefetch(1);

      ch.consume(q, function(msg) {
        var objmsg = JSON.parse(msg.content.toString());
        self.execute_function(objmsg,function(){
          ch.ack(msg);
        });
      }, {noAck: false});
      cb(null);

    });
  });

}

QueueReceiver.prototype.close = function(cb)
{
  var self=this;
  self.conn.close(cb);
}

QueueReceiver.prototype.set_execute_function = function(func){
  this.execute_function = func;
}

module.exports = QueueReceiver;
