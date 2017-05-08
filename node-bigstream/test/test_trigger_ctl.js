var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var amp = 'amqp://lab1.igridproject.info';

var EvenPub = ctx.getLib('lib/amqp/event-pub');
var evp = new EvenPub({'url':amqp_cfg.url,'name':'bs_trigger_cmd'});

var topic = 'ctl.trigger.all.reload';
var msg = {
  'trigger_type' : 'all',
  'cmd' : 'reload',
  'prm' : {}
}

evp.send(topic,msg);

setTimeout(function(){
  evp.close();
},500);
