var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var QueueCaller = ctx.getLib('lib/amqp/queuecaller');

var qc = new QueueCaller({'url':'amqp://bigmaster.igridproject.info'});

qc.send({'name':'kamron'});
