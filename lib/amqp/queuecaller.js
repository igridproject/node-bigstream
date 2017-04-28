var amqp = require('amqplib/callback_api');
var thunky = require('thunky');

function QueueCaller(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "task_queue";

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

        var q = self.name;
        ch.assertQueue(q, {durable: true});
        self.opened = true;
        self.conn = conn;
        self.ch = ch;
        cb();
      });
    });
  }

}

QueueCaller.prototype.send = function(msg)
{
  var self=this;
  this.open(function(err){
    if(err){
      console.log(err);
    }
    self.ch.sendToQueue(self.name, new Buffer(JSON.stringify(msg)), {persistent: true});
  });
}

QueueCaller.prototype.close = function(cb)
{
  var self=this;
  this.open(function(err){
    self.conn.close(cb);
  });
}

module.exports = QueueCaller;
