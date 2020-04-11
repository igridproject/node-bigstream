var util = require('util');
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
  this.jobcaller = prm.handle.jobcaller;
  this.storagecaller = prm.handle.storagecaller;
  this.acl_validator = prm.handle.acl_validator

  this.jobcfg = prm.job_config;
  this.input_meta = prm.input_meta;
  this.input_data = prm.input_data;
  this.transaction_id = prm.transaction_id;
  this.job_timeout = prm.opt.job_timeout || 60000;

  this.flag_continue = false;
  //0=>IDLE,1=>RUNNING,2=>DONE
  this.state = 0;

  this.stats = {
    'start_time':0,
    'end_time':0,
    'di':null,
    'dt':null,
    'do':null
  }
};
util.inherits(JobTask, EventEmitter);


JobTask.prototype.stop = function (status)
{
  var self=this;
  if(this.state==1){
    this.state = 2;
    if(this.flag_continue && status.status != "error"){
      //console.log(status);
      console.log('FLAG :: Continue JOB Transaction >>');
      repeat_job(this);
    }
    this.stats.end_time = (new Date).getTime();
    var dmsg = {
      'job_id':self.jobcfg.job_id,
      'transaction_id':self.transaction_id,
      'stats':self.stats,
      'result':status
    }
    this.emit('done', dmsg);
  }
}

JobTask.prototype.run = function ()
{
  var self=this;
  var transaction_id = this.transaction_id || genTransactionId();
  this.transaction_id = transaction_id;

  var input_meta = this.input_meta;
  var obj_input_data = getInputData(this.input_data);
  var job_tr_config = this.jobcfg;
  var job_id = job_tr_config.job_id;

  this.stats.start_time = (new Date).getTime();

  self.state = 1;

  var ctx_transaction = {
    "id" : transaction_id
  }

  var jobMem = new memstore({'job_id':job_id,'cat':'global','mem':self.mem})
  var ctx_job = {
    "memstore" : jobMem
  }

  var context = {
    "acl_validator" : this.acl_validator,
    "jobconfig" : job_tr_config,
    "transaction" : ctx_transaction,
    "input" : {'data':obj_input_data,'meta':input_meta} ,
    "job" : ctx_job
  }

  var task_di = function (callback) {
    var dm_i = domain.create();
    dm_i.on('error', function(err) {
      console.log('[DI] plugins error');
      console.log(err);
      self.stats.di = {'status':'error','data':'plugins error'};
      callback({'status':'error','data':'plugins error'});
    });

    dm_i.run(function() {
      perform_di({'context':context,'handle':self} ,function(err,resp){

        if(resp){
          // console.log('[DI STATUS]\t\t: ' + resp.status);
          self.stats.di = resp;
        }
        if(resp.status == 'success'){
          self.flag_continue = resp.flag.continue;
          callback(null,resp);
        }else if(resp.status == 'reject'){
          self.flag_continue = resp.flag.continue;
          callback(resp);
        }else{
          callback(resp);
        }
      });
    });

  }

  var task_dt = function (request,callback) {

    var dm_t = domain.create();
    dm_t.on('error', function(err) {
      console.log('[DT] plugins error');
      console.log(err);
      self.stats.dt = {'status':'error','data':'plugins error'};
      callback({'status':'error','data':'plugins error'});
    });

    dm_t.run(function() {
      var dt_cfg = context.jobconfig.data_transform;
      if(!Array.isArray(dt_cfg)){
        dt_cfg = [dt_cfg];
      }
      idx=0;
      async.reduce(dt_cfg, request, function(req, cur_cfg, cb) {
        var dt_name = (cur_cfg.tag)?cur_cfg.tag:String(idx);
        var dt_request = {'input_type':req.type,'meta':req.meta,'data':req.data};
        context.jobconfig.data_transform = cur_cfg;

        perform_dt({'cfg':cur_cfg,'name':dt_name,'context':context,'request':dt_request,'handle':self},function(err,dt_resp){

          if(dt_resp){
            // console.log('[DT:' + dt_name + ' STATUS]\t\t: ' + dt_resp.status);
          }

          idx++;
          if(dt_resp.status == 'success'){
            cb(null,dt_resp);
          }else {
            cb(dt_resp);
          }

        });

      }, function(err, result) {

        if(!err && result.status == 'success'){
          callback(null,result);
        }else {
          callback(err);
        }

      });

    //end dm_t run
    });

  }

  var task_do = function (request,callback) {
    var do_request = {'input_type':request.type,'meta':request.meta,'data':request.data}

    var dm_o = domain.create();
    dm_o.on('error', function(err) {
      console.log('[DO] plugins error');
      console.log(err);
      callback({'status':'error','data':'plugins error'});
    });

    dm_o.run(function() {
      perform_do({'context':context,'request':do_request,'handle':self},function(err,do_resp){
        if(do_resp){
          //console.log('[DO STATUS]\t\t: ' + do_resp.status);
        }
        if(do_resp.status == 'success'){
          callback(null,do_resp);
        }else {
          callback(do_resp);
        }
      });
    });

  }


  var jtimeout = setTimeout(function(){
    self.stop({'status':'error','data':'job execution timeout'});
    //self.emit('error',new Error('job execution timeout'))
  },self.job_timeout);

  // console.log('***** JOB RUNNING *****');
  // console.log('[JOB ID]\t\t: ' + job_id);
  // console.log('[TRANSACTION ID]\t: ' + transaction_id);

  async.waterfall([task_di,task_dt,task_do],function (err,resp) {
    clearTimeout(jtimeout);
    console.log('[JOB DONE] id=' + job_id + ' ,tr=' + transaction_id + '\t' + resp.status);
    if(!err){
      self.stop(resp)
      // console.log('***** JOB SUCCESSFULLY DONE *****\n');
    }else{
      self.stop(err)
      // console.log('***** JOB UNSUCCESSFULLY DONE *****\n');
    }
  });

}

function repeat_job(self)
{
  var jobcaller = self.jobcaller
  var cmd = {
    'object_type':'job_execute',
    'source' : 'worker',
    'jobId' : self.jobcfg.job_id,
    'option' : {'exe_level':'secondary'},
    'input_meta' : self.input_meta,
    'input_data' : self.input_data
  }

  jobcaller.send(cmd);
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
  var dt_cfg = prm.cfg;
  var dt_name=prm.name;
  //var dt_cfg = dt_context.jobconfig.data_transform;

  var DTTask = getPlugins('dt',dt_cfg.type);
  var dtMem = new memstore({'job_id':job_id,'cat':'dt:'+ dt_name,'mem':prm.handle.mem})
  dt_context.task = {
    "config" : dt_cfg,
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
  var doMem = new memstore({'job_id':job_id,'cat':'do','mem':prm.handle.mem});
  var jobcaller = prm.handle.jobcaller;
  var storagecaller = prm.handle.storagecaller;
  do_context.task = {
    "memstore" : doMem,
    "jobcaller" : jobcaller,
    "storagecaller" : storagecaller
  }

  var dout = new DOTask(do_context,prm.request);
  dout.run();
  dout.on('done',function(resp){

    cb(null,resp);
  });
}

function getPlugins(type,name)
{
  var path = '../../plugins/';
  var path_token= name.split('.');

  if(path_token.length >=2)
  {
    var pName = path_token.pop();
    var pPath = path_token.join('/');
    path = path + type + '/' + pPath + '/' + type + '-' + pName;
  }else{
    path += type + '/' + type + '-' + name;
  }
  return require(path);
}

function getInputData(obj)
{
  if(obj.type == 'bsdata')
  {
    var inp = bsdata.parse(obj.value);
    if(!inp){ return {}}
    return inp.data;
  }else{
    return {};
  }

}

function genTransactionId()
{
  var id = crypto.randomBytes(3).toString("hex");
  return "TR" + (new Date).getTime() + id;
}
