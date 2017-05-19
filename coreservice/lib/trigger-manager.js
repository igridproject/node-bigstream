var ctx = require('../../context');
var cfg = ctx.config;

var JobRegistry = ctx.getLib('lib/mems/job-registry');
var TriggerRegistry = ctx.getLib('lib/mems/trigger-registry');
var JUtils = ctx.getLib('lib/job/jobutils');
var EvenPub = ctx.getLib('lib/amqp/event-pub');

module.exports.create = function(cfg)
{
  return new TriggerManager(cfg);
}

function TriggerManager (cfg)
{
  this.config = cfg;
  this.conn = cfg.conn;
  this.mem = this.conn.getMemstore();
  this.evp = new EvenPub({'url':this.conn.getAmqpUrl(),'name':'bs_trigger_cmd'});

  // this.job_registry = JobRegistry.create({'redis':this.mem});
  // this.trigger_registry = TriggerRegistry.create({'redis':this.mem});
}

TriggerManager.prototype.reload = function (prm,cb)
{
  var self = this;
  var topic = 'ctl.trigger.all.reload';
  var msg = {
    'trigger_type' : 'all',
    'cmd' : 'reload',
    'prm' : {}
  }

  self.evp.send(topic,msg);

  if(typeof cb == 'function'){cb(null);}
}
