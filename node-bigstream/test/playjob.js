var storage = require('node-persist');
storage.initSync({
    dir:'db'
});
var memstore = require('./lib/memstore');

var CFG_FILE = "./jobs/testhttp.json";


var jobcfg = require(CFG_FILE);
run_job(jobcfg);




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

  //process di
  perform_di(context,function(err,resp){
    console.log('>> ' + resp.data);
  });

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
  di.on('done',function(response){
    cb(null,response);
  });
}

function getPlugins(type,name)
{
  var path = '../plugins/' + type + '/' + type + '-' +name;
  return require(path);
}
