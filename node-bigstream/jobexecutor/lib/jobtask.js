var util = require('util');
var async = require('async');
var domain = require('domain');
var EventEmitter = require('events').EventEmitter;

var ctx = require('../../context');
var memstore = ctx.getLib('jobexecutor/lib/memstore');
var bsdata = ctx.getLib('lib/model/bsdata');

function JobTask (prm)
{
  EventEmitter.call(this);

  this.handle = prm.handle;
  this.mem = prm.handle.mem;

  this.jobcfg = prm.job_config;
  this.input_data = prm.input_data;
  this.transaction_id = prm.transaction_id;

};
util.inherits(JobTask, EventEmitter);
//handle.emit('done',{'status':'error','data':err});

JobTask.prototype.run = function ()
{
  var self=this;
  var transaction_id = this.transaction_id || genTransactionId();
  var input_data = this.input_data;
  var job_tr_config = this.jobcfg;
  var job_id = job_tr_config.job_id;


  var ctx_transaction = {
    "id" : tranId
  }

  var jobMem = new memstore({'job_id':job_id,'cat':'global','mem':self.mem})
  var ctx_job = {
    "memstore" : jobMem
  }

  var context = {
    "jobconfig" : job_tr_config,
    "transaction" : ctx_transaction,
    "input_data" : input_data,
    "job" : ctx_job
  }
}

function perform_di(prm,cb)
{
  var di_context = prm.context;

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

function perform_dt(prm,cb)
{
  var dt_context = prm.context

  var jobId = dt_context.jobconfig.job_id;
  var dt_cfg = dt_context.jobconfig.data_transform;

  var DITask = getPlugins('dt',dt_cfg.type);
  var mempref = "ms." + jobId + '.dt';
  var dtMem = new memstore(mempref,storage);
  dt_context.task = {
    "memstore" : dtMem
  }

  var dt = new DITask(dt_context,prm.request);

  dt.run();
  dt.on('done',function(resp){
    cb(null,resp);
  });
}

function perform_do(prm,cb)
{
  var do_context = prm.context

  var jobId = do_context.jobconfig.job_id;
  var do_cfg = do_context.jobconfig.data_out;

  var DOTask = getPlugins('do',do_cfg.type);
  var mempref = "ms." + jobId + '.do';
  var doMem = new memstore(mempref,storage);
  do_context.task = {
    "memstore" : doMem
  }

  var dout = new DOTask(do_context,prm.request);
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

function genTransactionId()
{
  return "TR" + (new Date).getTime();
}
