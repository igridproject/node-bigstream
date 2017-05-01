var util = require('util');
var crypto = require("crypto");
var EventEmitter = require('events').EventEmitter;
var async = require('async');

var ctx = require('../../context');
var cfg = ctx.config;

var JobTask = ctx.getLib('jobworker/lib/jobtask');

var JT = function JobTransaction(prm)
{
  EventEmitter.call(this);

  this.handle = prm.handle;
  this.transaction_id = genTransactionId();
  this.cmd = prm.cmd;

}
module.exports = JT;
util.inherits(JT, EventEmitter);

JT.prototype.run = function (done)
{
  var self = this;
  var job_registry = self.handle.job_registry;
  var command = self.cmd;

  if(!validate_execute_cmd(command)){
    return done("invalid command");
  }

  var jobId = command.jobId;
  var getJobCfg = function(callback){
    //red jobconfig
    job_registry.getJob(jobId,function(err,data){
      if(!data){
        callback('job ' + jobId + ' does not exits');
      }else{
        callback(err,data);
      }
    })
  }

  var runJobTask = function(jobCfg,callback){
    var task_prm = {
                  'handle' : self.handle,
                  'job_config' : jobCfg,
                  'input_data' : command.input_data,
                  'opt' : {'job_timeout' :60000}
                }
    if(jobCfg.job_timeout){
      task_prm.opt.job_timeout = jobCfg.job_timeout;
    }

    var job = new JobTask(task_prm);
    job.on('done',function(res){
      callback(null)
    });
    job.run();

  }

  async.waterfall([getJobCfg,runJobTask]
    , function (err) {
    if(!err){
      done(null);
    }else{
      done(err);
    }
  });

}

function validate_execute_cmd(cmd)
{
  if(cmd.object_type && cmd.object_type == 'job_execute')
  {
    return true;
  }
  return false;
}

function genTransactionId()
{
  var id = crypto.randomBytes(3).toString("hex");
  return "TR" + (new Date).getTime() + id;
}
