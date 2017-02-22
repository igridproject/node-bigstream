var amqp = require('amqplib/callback_api');

amqp.connect('amqp://lab1.igridproject.info', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'topic_logs';
    var key = 'q.test.t1';
    var msg = 'Hello World!';

    ch.assertExchange(ex, 'topic', {durable: false});
    ch.publish(ex, key, new Buffer(msg));
    console.log(" [x] Sent %s:'%s'", key, msg);
    // ch.publish(ex, key, new Buffer(msg),function(err){
    //   console.log(" [x] Sent %s:'%s'", key, msg);
    //   conn.close()
    // });
    // conn.close(function(err){
    //   console.log('cloased');
    // });
  });
  //setTimeout(function() { conn.close(); process.exit(0) }, 15000);
});
