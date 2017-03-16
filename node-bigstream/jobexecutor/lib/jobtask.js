var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ctx = require('../../context');
var memstore = ctx.getLib('jobexecutor/lib/memstore');

function JobTask (prm)
{
  EventEmitter.call(this);

  this.handle = prm.handle;
  this.jobcfg = prm.job_config;

};
util.inherits(JobTask, EventEmitter);
//handle.emit('done',{'status':'error','data':err});

JobTask.prototype.run = function ()
{

}

function perform_di(context,cb)
{
  var di_context = context;

  var jobId = di_context.jobconfig.job_id;
  var di_cfg = di_context.jobconfig.data_in;

  var DITask = getPlugins('di',di_cfg.type);
  var mempref = "ms." + jobId + '.di';
  var diMem = new memstore(mempref,storage);
  di_context.task = {
    "memstore" : diMem
  }

  var di = new DITask(di_context);
  di.run();
  di.on('done',function(resp){
    cb(null,resp);
  });
}

function perform_dt(context,request,cb)
{
  var dt_context = context

  var jobId = dt_context.jobconfig.job_id;
  var dt_cfg = dt_context.jobconfig.data_transform;

  var DITask = getPlugins('dt',dt_cfg.type);
  var mempref = "ms." + jobId + '.dt';
  var dtMem = new memstore(mempref,storage);
  dt_context.task = {
    "memstore" : dtMem
  }

  var dt = new DITask(dt_context,request);

  dt.run();
  dt.on('done',function(resp){
    cb(null,resp);
  });
}

function perform_do(context,request,cb)
{
  var do_context = context

  var jobId = do_context.jobconfig.job_id;
  var do_cfg = do_context.jobconfig.data_out;

  var DOTask = getPlugins('do',do_cfg.type);
  var mempref = "ms." + jobId + '.do';
  var doMem = new memstore(mempref,storage);
  do_context.task = {
    "memstore" : doMem
  }

  var dout = new DOTask(do_context,request);
  dout.run();
  dout.on('done',function(resp){
    cb(null,resp);
  });
}

function getPlugins(type,name)
{
  var path = '../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}
