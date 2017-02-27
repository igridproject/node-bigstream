#!/usr/bin/env node
var ctx = require('../context');
var cfg = ctx.config;

var amqp = require('amqplib/callback_api');



amqp.connect('amqp://bigmaster.igridproject.info', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'bs_job_cmd';

    ch.assertExchange(ex, 'topic', {durable: false});

    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log(' [*] Waiting for logs. To exit press CTRL+C');

      ch.bindQueue(q.queue, ex, 'cmd.#');


      ch.consume(q.queue, function(msg) {
        console.log(JSON.stringify(msg));
        console.log(msg.fields.routingKey + '\n');
        console.log(msg.content.toString() + '\n');
        console.log('----------------------------------');
      }, {noAck: true});
    });
  });
});
