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

  console.log('JOB RUNNING \n[TRANSACTION ID]\t: ' + transaction.id + '\n');

  //process di
  perform_di(context,function(err,resp){

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

function getPlugins(type,name)
{
  var path = '../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}
