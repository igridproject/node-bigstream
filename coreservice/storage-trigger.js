var schedule = require('node-schedule');

var ctx = require('../context');
var cfg = ctx.config;
var amqp_cfg = ctx.config.amqp;

var ConnCtx = ctx.getLib('lib/conn/connection-context');
var StorageEventList = ctx.getLib('lib/mems/storage-eventlist');
var CronList = ctx.getLib('lib/mems/cronlist');
var QueueCaller = ctx.getLib('lib/amqp/queuecaller');
var EvenSub = ctx.getLib('lib/amqp/event-sub');

var TRIGGER_TYPE = "storage";

module.exports.create = function (cfg)
{
  return new StorageTrigger(cfg);
}

function StorageTrigger(cfg)
{
  this.config = cfg;

  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore();
  this.jobcaller = new QueueCaller({'url':amqp_cfg.url,'name':'bs_jobs_cmd'});
  this.evs = new EvenSub({'url':amqp_cfg.url,'name':'bs_trigger_cmd'});
  this.storage_ev = new EvenSub({'url':amqp_cfg.url,'name':'bs_storage'});

  this.sel = StorageEventList.create({'conn':this.config.memstore.url});

}

StorageTrigger.prototype.start = function ()
{
  console.log('STORAGE_TRIGGER:Starting\t\t[OK]');
  this._start_listener();
  this._start_controller();
}

StorageTrigger.prototype._start_listener = function ()
{
  console.log('STORAGE_TRIGGER:Starting Listener\t[OK]');
  var self = this;
  self.reset();
  self.reload();
  self.storage_ev.sub('storage.#.dataevent.newdata',(err,msg)=>{
    if(!err){
      var topic = msg.topic;
      var storage_name = topic.substr(8,topic.length-26);
      var sdata = msg.data;
      sdata.storage_name = storage_name;

      var jobs = self.sel.findJob(storage_name);
      jobs.forEach(function(item){
        self._callJob(item.jobid,sdata);
      });

    }
  });
}

StorageTrigger.prototype.reload = function ()
{
  this.sel.update(function(err){
    if(!err){
      console.log('STORAGE_TRIGGER:SEL Update\t\t[OK]');
    }else{
      console.log('STORAGE_TRIGGER:SEL Update\t\t[ERR]');
    }
  });
}

StorageTrigger.prototype.reset = function ()
{
  this.sel.clean();
}

StorageTrigger.prototype._callJob = function(jobid,sl)
{
  var storage_ev_data = {
    'object_type' : 'storage_event_data',
    'event':sl.event,
    'storage_name' : sl.storage_name,
    'resource_id' : sl.resource_id,
    'resource_location':sl.resource_location
  }

  var cmd = {
    'object_type':'job_execute',
    'source' : 'storage_trigger',
    'jobId' : jobid,
    'option' : {'exe_level':'secondary'},
    'input_data' : {
      'type' : 'bsdata',
      'value' : {
        'object_type':'bsdata',
        'data_type' : 'object',
        'data' : storage_ev_data
      }
    }
  }

  this.jobcaller.send(cmd);
}

StorageTrigger.prototype._start_controller = function ()
{
  var self=this;
  var topic = 'ctl.trigger.#';
  self.evs.sub(topic,function(err,msg){
    if(err){
      console.log('STORAGE_TRIGGER:AMQP ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }

    if(!msg){return;}

    var ctl = msg.data;
    if(ctl.trigger_type != TRIGGER_TYPE && ctl.trigger_type != 'all')
    {
      return;
    }

    if(ctl.cmd == 'reload')
    {
      console.log('STORAGE_TRIGGER:CMD Reload\t\t[OK]');
      self.reload();
    }

  });
}
