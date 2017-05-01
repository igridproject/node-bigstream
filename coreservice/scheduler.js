var schedule = require('node-schedule');

var ctx = require('../context');
var cfg = ctx.config;
var amqp_cfg = ctx.config.amqp;

var ConnCtx = ctx.getLib('lib/conn/connection-context');
var CronList = ctx.getLib('lib/mems/cronlist');
var QueueCaller = ctx.getLib('lib/amqp/queuecaller');

module.exports.create = function (cfg)
{
  return new SchedulerService(cfg);
}

function SchedulerService(cfg)
{
  this.config = cfg;

  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore();
  this.jobcaller = new QueueCaller({'url':amqp_cfg.url,'name':'bs_jobs_queue'});

  this.crons = CronList.create({'redis':this.mem});
  this.engine = [];
}

SchedulerService.prototype.start = function ()
{
  console.log('SCHEDULER:Starting\t\t[OK]');
  this.reload();
}

SchedulerService.prototype.reload = function ()
{
  console.log('SCHEDULER:Reloading CronList\t[OK]');
  var self = this;
  self.clean();
  self.crons.update(function(err){
    var cl = self.crons.list;
    for(var i=0;i<cl.length;i++)
    {
      var s = schedule.scheduleJob(cl[i].cmd, function(y){
        self._callJob(y);
      }.bind(null,cl[i]));
      self.engine.push(s);
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

SchedulerService.prototype._callJob = function(cron)
{
  var cmd = {
    'object_type':'job_execute',
    'source' : 'scheduler',
    'jobId' : cron.jobid,
    'option' : {},
    'input_data' : {
      'type' : 'bsdata',
      'value' : {
        'data_type' : 'object',
        'data' : {}
      }
    }
  }

  this.jobcaller.send(cmd);

}
