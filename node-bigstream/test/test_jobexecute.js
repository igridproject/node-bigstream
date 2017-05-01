var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var QueueCaller = ctx.getLib('lib/amqp/queuecaller');

var qc = new QueueCaller({'url':'amqp://bigmaster.igridproject.info','name':'bs_jobs_queue'});


var cmd = {
  'object_type':'job_execute',
  'source' : 'http_listener',
  'jobId' : 'job03',
  'option' : {},
  'input_data' : {
    'type' : 'bsdata',
    'value' : {
      'data_type' : 'object',
      'data' : {'name':'gcs'}
    }
  }
}


qc.send(cmd);
