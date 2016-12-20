var async = require('async');
var schedule = require('node-schedule');
var storage = require('node-persist');
storage.initSync({
    dir:'db'
});
var memstore = require('./lib/memstore');

var CFG_FILE = "./jobs/example.json";
var TRACKING = 2;
var ONTRIGGER = true;

var args = process.argv.slice(2);

if(args.length > 0){
  if(args.length==1){
    CFG_FILE = "./jobs/" + args[0];
  }else{
    CFG_FILE = "./jobs/" + args[args.length-1];
    for(var i=0;i<args.length-1;i++){
      switch (args[i]) {
        case '-log0':
          TRACKING = 0;
          break;
        case '-log1' :
          TRACKING = 1;
          break;
        case '-log2' :
          TRACKING = 2;
          break;
        case '-notrigger' :
          ONTRIGGER=false;
          break;
      }
    }

  }
}

var jobcfg = require(CFG_FILE);

track('[SETTING UP JOB] : ' + CFG_FILE,TRACKING>0);
if(jobcfg.trigger && jobcfg.trigger.type == 'cron' && ONTRIGGER)
{
  var triggercfg = jobcfg.trigger;
  var cron = jobcfg.trigger.cmd;
  track('[SCHEDULE MODE]',TRACKING>0);
  track('[CRON]\t\t: ' + cron,TRACKING>0);

  var j = schedule.scheduleJob(cron, function(){
    run_job(jobcfg);
  });

}else{
  run_job(jobcfg);
}



function run_job(cfg)
{
  var jobconfig = cfg;
  var tranId = "TR" + (new Date).getTime();
  var transaction = {
    "id" : tranId
  }
  var context = {
    "jobconfig" : jobconfig,
    "transaction" : transaction
  }

  track('***** JOB RUNNING *****\n[TRANSACTION ID]\t: ' + transaction.id + '\n',TRACKING>0);

  async.waterfall([
    function(callback){
      perform_di(context,function(err,resp){
        if(resp.status == 'success'){
          callback(null,resp);
        }else{
          callback(resp);
        }
      });
    },
    function(request,callback){
      var dt_request = {'input_type':request.type,'data':request.data}
      perform_dt(context,dt_request,function(err,dt_resp){
        if(dt_resp.status == 'success'){
          callback(null,dt_resp);
        }else {
          callback(dt_resp);
        }
      });
    },
    function(request,callback){
      var do_request = {'input_type':request.type,'data':request.data}
      perform_do(context,do_request,function(err,do_resp){
        if(do_resp.status == 'success'){
          callback(null,do_resp);
        }else {
          callback(dt_resp);
        }
      });
    }
  ],
  function(err,resp){
    if(err){
      track('\n***** JOB UNSUCCESSFULLY DONE *****\n\n',TRACKING>0);
    }else{
      track('\n***** JOB SUCCESSFULLY DONE *****\n\n',TRACKING>0);
    }
  });

}

function perform_di(context,cb)
{
  track('[RUNNING DI]',TRACKING>1);
  var di_context = context;

  var jobId = di_context.jobconfig.job_id;
  var di_cfg = di_context.jobconfig.data_in;

  track('[DI_PLUGIN]\t\t: ' + di_cfg.type,TRACKING>1);
  var DITask = getPlugins('di',di_cfg.type);
  var mempref = "ms." + jobId + '.di';
  var diMem = new memstore(mempref,storage);
  di_context.task = {
    "memstore" : diMem
  }

  var di = new DITask(di_context);
  di.run();
  di.on('done',function(resp){
    track('[DI_OUTPUT_TYPE]\t: ' + resp.type,TRACKING>1);
    track('[DI_STATUS]\t\t: ' + resp.status,TRACKING>1);
    track('DATA>>' + resp.data,TRACKING>1);
    cb(null,resp);
  });
}

function perform_dt(context,request,cb)
{
  track('\n[RUNNING DT]',TRACKING>1);
  var dt_context = context

  var jobId = dt_context.jobconfig.job_id;
  var dt_cfg = dt_context.jobconfig.data_transform;

  track('[DT_PLUGIN]\t\t: ' + dt_cfg.type,TRACKING>1);
  var DITask = getPlugins('dt',dt_cfg.type);
  var mempref = "ms." + jobId + '.dt';
  var dtMem = new memstore(mempref,storage);
  dt_context.task = {
    "memstore" : dtMem
  }

  var dt = new DITask(dt_context,request);
  dt.run();
  dt.on('done',function(resp){
    track('[DT_OUTPUT_TYPE]\t: ' + resp.type,TRACKING>1);
    track('[DT_STATUS]\t\t: ' + resp.status,TRACKING>1);
    track('DATA>>' + resp.data,TRACKING>1);
    cb(null,resp);
  });
}

function perform_do(context,request,cb)
{
  track('\n[RUNNING DO]',TRACKING>1);
  var do_context = context

  var jobId = do_context.jobconfig.job_id;
  var do_cfg = do_context.jobconfig.data_out;

  track('[DO_PLUGIN]\t\t: ' + do_cfg.type,TRACKING>1);
  var DOTask = getPlugins('do',do_cfg.type);
  var mempref = "ms." + jobId + '.do';
  var doMem = new memstore(mempref,storage);
  do_context.task = {
    "memstore" : doMem
  }

  var dout = new DOTask(do_context,request);
  dout.run();
  dout.on('done',function(resp){
    track('[DO_STATUS]\t\t: ' + resp.status,TRACKING>1);
    //console.log('>>' + resp.data);
    cb(null,resp);
  });
}

function track(str,is_print)
{
  if(is_print){
    console.log(str);
  }
}

function getPlugins(type,name)
{
  var path = '../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}
