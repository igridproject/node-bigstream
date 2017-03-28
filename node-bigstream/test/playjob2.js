var async = require('async');
var domain = require('domain');
var schedule = require('node-schedule');
var storage = require('node-persist');

var ctx = require('../context');
var bscfg = ctx.config;
var bsdata = ctx.getLib('lib/model/bsdata');
var EvenSub = ctx.getLib('lib/amqp/event-sub');

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

var no_input_data = {};

track('[SETTING UP JOB] : ' + CFG_FILE,TRACKING>0);
if(jobcfg.trigger && ONTRIGGER)
{
  var triggercfg = jobcfg.trigger;
  var triggertpy = jobcfg.trigger.type

  if(triggertpy == 'cron'){
    trigger_cron(jobcfg,no_input_data);
  }else if(triggertpy == 'http'){
    trigger_http(jobcfg);
  }else{
    run_job(jobcfg,no_input_data);
  }
}else{
  run_job(jobcfg,no_input_data);
}

function trigger_cron(jobcfg,input)
{
  var cron = jobcfg.trigger.cmd;
  track('[SCHEDULE MODE]',TRACKING>0);
  track('[CRON]\t\t: ' + cron,TRACKING>0);
  var j = schedule.scheduleJob(cron, function(){
    run_job(jobcfg,input);
  });
}

function trigger_http(jobcfg)
{
  var jobId = jobcfg.job_id;
  var appkey = jobcfg.trigger.appkey;
  track('[HTTP MODE]',TRACKING>0);
  track('[APPKEY]\t\t: ' + appkey,TRACKING>0);

  var evs = new EvenSub({'url':bscfg.amqp.url,'name':'bs_job_cmd'});
  evs.sub('cmd.execute.' + jobId  ,function(err,msg){
    var input_data = msg.data.input_data;

    if(input_data.type == 'bsdata')
    {
      var inp = bsdata.parse(input_data.value);
      run_job(jobcfg,inp.data);
    }else{
      run_job(jobcfg,no_input_data);
    }
  });
}

function run_job(cfg,input)
{
  var jobconfig = cfg;
  var tranId = "TR" + (new Date).getTime();
  var jobId = jobconfig.job_id;
  var transaction = {
    "id" : tranId
  }

  var jobmempref = "ms." + jobId + '.mem';
  var jobMem = new memstore(jobmempref,storage);
  var ctxJob = {
    "memstore" : jobMem
  }

  var context = {
    "jobconfig" : jobconfig,
    "transaction" : transaction,
    "input_data" : input,
    "job" : ctxJob
  }


  track('***** JOB RUNNING *****',TRACKING>0);
  track('[START TIME]\t\t: ' + (new Date(Date.now())).toUTCString(),TRACKING>0);
  track('[TRANSACTION ID]\t: ' + transaction.id + '\n',TRACKING>0);

  async.waterfall([
    function(callback){

      var dm_i = domain.create();
      dm_i.on('error', function(err) {
        console.log('plugins error');
        console.log(err);
        callback(err)
      });

      dm_i.run(function() {

        perform_di(context,function(err,resp){
          if(resp.status == 'success'){
            callback(null,resp);
          }else{
            callback(resp);
          }
        });

      });

    },
    function(request,callback){
      var dt_request = {'input_type':request.type,'data':request.data}

      var dm_t = domain.create();
      dm_t.on('error', function(err) {
        console.log('plugins error');
        console.log(err);
        callback(err)
      });

      dm_t.run(function() {

        perform_dt(context,dt_request,function(err,dt_resp){
          if(dt_resp.status == 'success'){
            callback(null,dt_resp);
          }else {
            callback(dt_resp);
          }
        });

      });

    },
    function(request,callback){
      var do_request = {'input_type':request.type,'data':request.data}

      var dm_o = domain.create();
      dm_o.on('error', function(err) {
        console.log('plugins error');
        console.log(err);
        callback(err)
      });

      dm_o.run(function() {

        perform_do(context,do_request,function(err,do_resp){
          if(do_resp.status == 'success'){
            callback(null,do_resp);
          }else {
            callback(do_resp);
          }
        });

      });

    }
  ],
  function(err,resp){
    track('\n[FINISH TIME]\t\t: ' + (new Date(Date.now())).toUTCString(),TRACKING>0);
    if(err){
      track('***** JOB UNSUCCESSFULLY DONE *****\n\n',TRACKING>0);
    }else{
      track('***** JOB SUCCESSFULLY DONE *****\n\n',TRACKING>0);
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

  //convert to array
  var arr_dt_cfg = [];
  if(!Array.isArray(dt_cfg)){
    arr_dt_cfg.push(dt_cfg);
  }else{
    arr_dt_cfg = dt_cfg;
  }

  var dt_count = arr_dt_cfg.length
  var p_idx=0;

  async.whilst(
    function() { return p_idx < 5; },
    function(callback) {

      track('[DT_PLUGIN]\t\t: ' + dt_cfg.type,TRACKING>1);
      var DTTask = getPlugins('dt',dt_cfg.type);
      var mempref = "ms." + jobId + '.dt';
      var dtMem = new memstore(mempref,storage);
      dt_context.task = {
        "memstore" : dtMem
      }

      var dt = new DTTask(dt_context,request);

      dt.run();
      dt.on('error',function(err){
        console.log('ERR');
        console.log(err);
      });
      dt.on('done',function(resp){
        track('[DT_OUTPUT_TYPE]\t: ' + resp.type,TRACKING>1);
        track('[DT_STATUS]\t\t: ' + resp.status,TRACKING>1);
        track('DATA>>' + resp.data,TRACKING>1);
        cb(null,resp);
      });
////do this
    },
    function (err, resp) {
        // 5 seconds have passed, n = 5
    }
  );

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
