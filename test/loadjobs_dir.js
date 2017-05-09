var fs = require('fs');
var redis = require('redis');

var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var JobRegistry = ctx.getLib('lib/mems/job-registry');
var CronList = ctx.getLib('lib/mems/cronlist');

var jobDir = 'jobs_dir';
//var mem = redis.createClient('redis://localhost:9736/1');
var mem = redis.createClient('redis://localhost:6379/1');
//var mem = redis.createClient('redis://lab1.igridproject.info:6379/1');
var job_registry = JobRegistry.create({'redis':mem});
var crons = CronList.create({'redis':mem});

fs.readdir(jobDir, (err, files) => {
  files.forEach(file => {
    addJobFile(file)
  });
})

setTimeout(function(){
  console.log('OK');
  save();
},10000);

function addJobFile(filename)
{
  var fpath = jobDir + '/' + filename;
  var job = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  job = edit_job(job);
  if(job && job.job_id && job.trigger)
  {
    console.log('add job ' + job.job_id);
    mkJob(job);
    mkCronTrigger(job);
  }else{
    console.log('ERROR ' + filename);
  }
}

function mkJob(job)
{
  //console.log(job);
  job_registry.setJob(job.job_id,job);
}

function mkCronTrigger(job)
{
  var jobId = job.job_id;
  var cmd = job.trigger.cmd;

  var cr = CronList.mkCron(jobId,cmd,jobId)
  crons.add(cr);
}

function save()
{
  crons.commit()
}

function edit_job(job)
{
  eJob = job;

  eJob.trigger.cmd = '29,59 * * * *';
  eJob.data_in.param.url = 'http://122.155.1.142/ws/get2.php';
  eJob.data_in.param.init_observed_date = '2017-05-01';

  return eJob;
}
