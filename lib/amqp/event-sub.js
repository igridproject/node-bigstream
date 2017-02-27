var amqp = require('amqplib/callback_api');
var thunky = require('thunky');

function EventSub(config)
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
        
        ch.assertExchange(self.name, 'topic', {durable: false});
        self.opened = true;
        self.conn = conn;
        self.ch = ch;
        cb();
      });
    });

  }
}

EventSub.prototype.sub = function(topic,cb)
{
  var self=this;
  this.open(function(err){
    if(err){return cb(err);}
    self.ch.assertQueue('', {exclusive: true}, function(err, q) {
      //console.log(' [*] Waiting for logs. To exit press CTRL+C');
      if(err){return cb(err);}
      self.ch.bindQueue(q.queue, self.name, topic);
      self.ch.consume(q.queue, function(msg) {
        var data = JSON.parse(msg.content.toString())
        var topp = msg.fields.routingKey
        cb(null,{'topic':topp,'data':data});
      }, {noAck: true});
    });

  });
}

EventSub.prototype.close = function(cb)
{
  var self=this;
  self.conn.close(cb);
}

module.exports = EventSub;
