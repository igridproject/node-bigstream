var schedule = require('node-schedule');

var ctx = require('../context');
var cfg = ctx.config;

var ConnCtx = ctx.getLib('lib/conn/connection-context');
var CronList = ctx.getLib('lib/mems/cronlist');
var QueueCaller = ctx.getLib('lib/amqp/queuecaller');

function SchedulerService(cfg)
{
  this.config = cfg;

  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore();

  this.crons = CronList.create({'redis':this.mem});
  this.engine = [];
}

SchedulerService.prototype.start = function ()
{


}

SchedulerService.prototype.reload = function ()
{
  var self = this;
  self.crons.update(function(err){
    var cl = self.crons.list;
    for(var i=0;i<cl.length;i++)
    {

    }

  });

}

SchedulerService.prototype.clean = function ()
{
  var arrEngine = this.engine;
  for(var i=0;i<arrEngine.length;i++)
  {
    arrEngine[i].cancel();
  }
  this.engine = [];
}
