var amqp = require('amqplib/callback_api');
var thunky = require('thunky');

function EventPub(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "event_group";

  this.conn = null;
  this.ch = null;

  var self = this;

  this.opened = false;
  this.open = thunky(open);
  this.open();

  function open (cb) {
    //console.log('connecting');
    amqp.connect(self.url, function(err, conn) {
      if (err){return cb(err)}
      conn.createChannel(function(err, ch) {
        if (err){return cb(err)}

        var ex = self.name;
        ch.assertExchange(ex, 'topic', {durable: false});
        self.opened = true;
        self.conn = conn;
        self.ch = ch;
        cb();
      });
    });

  }

}

EventPub.prototype.send = function(topic,msg)
{
  var self=this;
  this.open(function(err){
    self.ch.publish(self.name, topic, Buffer.from(JSON.stringify(msg)));
  });
}

EventPub.prototype.close = function(cb)
{
  var self=this;
  self.conn.close(cb);

}

module.exports = EventPub;
