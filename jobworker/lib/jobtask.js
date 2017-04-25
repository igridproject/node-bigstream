var util = require('util');
var domain = require('domain');
var async = require('async');
var domain = require('domain');
var crypto = require("crypto");
var EventEmitter = require('events').EventEmitter;

var ctx = require('../../context');
var memstore = require('./memstore');
var bsdata = ctx.getLib('lib/model/bsdata');

module.exports = JobTask;
function JobTask (prm)
{
  EventEmitter.call(this);

  if(!prm.opt){prm.opt={};}

  this.handle = prm.handle;
  this.mem = prm.handle.mem;

  this.jobcfg = prm.job_config;
  this.input_data = prm.input_data;
  this.transaction_id = prm.transaction_id;
  this.job_timeout = prm.opt.job_timeout || 3000;

  //0=>IDLE,1=>RUNNING,2=>DONE
  this.state = 0;

};
util.inherits(JobTask, EventEmitter);
//handle.emit('done',{'status':'error','data':err});

JobTask.prototype.stop = function (status)
{
  if(this.state==1){
    this.state = 2;
    this.emit('done', status);
  }
}

JobTask.prototype.run = function ()
{
  var self=this;
  var transaction_id = this.transaction_id || genTransactionId();
  var input_data = this.input_data;
  var job_tr_config = this.jobcfg;
  var job_id = job_tr_config.job_id;

  self.state = 1;

  var ctx_transaction = {
    "id" : transaction_id
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

  var task_di = function (callback) {
    perform_di({'context':context,'handle':self} ,function(err,resp){
      if(resp.status == 'success'){
        callback(null,resp);
      }else{
        callback(resp);
      }
    });
  }

  var task_dt = function (request,callback) {
    var dt_request = {'input_type':request.type,'data':request.data}
    perform_dt({'context':context,'request':dt_request,'handle':self},function(err,dt_resp){
      if(dt_resp.status == 'success'){
        callback(null,dt_resp);
      }else {
        callback(dt_resp);
      }
    });
  }

  var task_do = function (request,callback) {
    var do_request = {'input_type':request.type,'data':request.data}
    perform_do({'context':context,'request':do_request,'handle':self},function(err,do_resp){
      if(do_resp.status == 'success'){
        callback(null,do_resp);
      }else {
        callback(do_resp);
      }
    });
  }


  var jtimeout = setTimeout(function(){
    self.stop({'status':'error','data':'job execution timeout'});

    //self.emit('error',new Error('job execution timeout'))
  },self.job_timeout);

  async.waterfall([task_di,task_dt,task_do],function (err,resp) {
    clearTimeout(jtimeout);
    if(!err){
      self.stop(resp)
      //console.log('***** JOB SUCCESSFULLY DONE *****');
    }else{
      self.stop(err)
      //console.log('***** JOB UNSUCCESSFULLY DONE *****');
    }
  });



}

function perform_di(prm,cb)
{
  var di_context = prm.context;

  var job_id = di_context.jobconfig.job_id;
  var di_cfg = di_context.jobconfig.data_in;

  var DITask = getPlugins('di',di_cfg.type);
  var diMem = new memstore({'job_id':job_id,'cat':'di','mem':prm.handle.mem})
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

  var job_id = dt_context.jobconfig.job_id;
  var dt_cfg = dt_context.jobconfig.data_transform;

  var DTTask = getPlugins('dt',dt_cfg.type);
  var dtMem = new memstore({'job_id':job_id,'cat':'dt','mem':prm.handle.mem})
  dt_context.task = {
    "memstore" : dtMem
  }

  var dt = new DTTask(dt_context,prm.request);

  dt.run();
  dt.on('done',function(resp){
    cb(null,resp);
  });
}

function perform_do(prm,cb)
{
  var do_context = prm.context

  var job_id = do_context.jobconfig.job_id;
  var do_cfg = do_context.jobconfig.data_out;

  var DOTask = getPlugins('do',do_cfg.type);
  var doMem = new memstore({'job_id':job_id,'cat':'do','mem':prm.handle.mem})
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
  var path = '../../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}

function genTransactionId()
{
  var id = crypto.randomBytes(3).toString("hex");
  return "TR" + (new Date).getTime() + id;
}
