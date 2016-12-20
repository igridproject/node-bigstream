var schedule = require('node-schedule');
var storage = require('node-persist');
storage.initSync({
    dir:'db'
});
var memstore = require('./lib/memstore');

var CFG_FILE = "./jobs/example.json";

var args = process.argv.slice(2);

if(args.length > 0){
  CFG_FILE = "./jobs/" + args[0];
}

var jobcfg = require(CFG_FILE);

if(jobcfg.trigger && jobcfg.trigger.type == 'cron')
{
  var triggercfg = jobcfg.trigger;
  var cron = jobcfg.trigger.cmd;
  console.log('[SCHEDULE MODE]');
  console.log('[CRON]\t\t: ' + cron);

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

  console.log('***** JOB RUNNING *****\n[TRANSACTION ID]\t: ' + transaction.id + '\n');

  //process di
  perform_di(context,function(err,resp){
      if(resp.status == 'success' && context.jobconfig.data_transform){
        var dt_request = {'type':resp.type,'data':resp.data}
        perform_dt(context,dt_request,function(err,dt_resp){

          console.log('***** JOB DONE *****\n\n');
        });
      }else{
        console.log('***** JOB DONE *****\n\n');
      }
  });

}

function perform_di(context,cb)
{
  console.log('[RUNNING DI]');
  var di_context = context;

  var jobId = di_context.jobconfig.job_id;
  var di_cfg = di_context.jobconfig.data_in;

  console.log('[DI_PLUGIN]\t\t: ' + di_cfg.type);
  var DITask = getPlugins('di',di_cfg.type);
  var mempref = "ms." + jobId + '.di';
  var diMem = new memstore(mempref,storage);
  di_context.task = {
    "memstore" : diMem
  }

  var di = new DITask(di_context);
  di.run();
  di.on('done',function(resp){
    console.log('[DI_OUTPUT_TYPE]\t: ' + resp.type);
    console.log('[DI_STATUS]\t\t: ' + resp.status);
    console.log('>>' + resp.data);
    cb(null,resp);
  });
}

function perform_dt(context,request,cb)
{
  console.log('\n\n[RUNNING DT]');
  var dt_context = context

  var jobId = dt_context.jobconfig.job_id;
  var dt_cfg = dt_context.jobconfig.data_transform;

  console.log('[DT_PLUGIN]\t\t: ' + dt_cfg.type);
  var DITask = getPlugins('dt',dt_cfg.type);
  var mempref = "ms." + jobId + '.dt';
  var dtMem = new memstore(mempref,storage);
  dt_context.task = {
    "memstore" : dtMem
  }

  var dt = new DITask(dt_context,request);
  dt.run();
  dt.on('done',function(resp){
    console.log('[DT_OUTPUT_TYPE]\t: ' + resp.type);
    console.log('[DT_STATUS]\t\t: ' + resp.status);
    console.log('>>' + resp.data);
    cb(null,resp);
  });
}

function perform_do(context,request,cb)
{
  console.log('\n\n[RUNNING DO]');
  var do_context = context

  var jobId = do_context.jobconfig.job_id;
  var do_cfg = do_context.jobconfig.data_out;

  console.log('[DO_PLUGIN]\t\t: ' + do_cfg.type);
  var DOTask = getPlugins('do',do_cfg.type);
  var mempref = "ms." + jobId + '.do';
  var doMem = new memstore(mempref,storage);
  do_context.task = {
    "memstore" : doMem
  }

  var dout = new DOTask(do_context,request);
  dout.run();
  dout.on('done',function(resp){
    console.log('[DO_STATUS]\t\t: ' + resp.status);
    console.log('>>' + resp.data);
    cb(null,resp);
  });
}

function getPlugins(type,name)
{
  var path = '../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}
