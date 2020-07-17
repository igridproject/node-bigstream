var ctx = require('../../context');

var async = require('async');
var express = require('express');
var router = express.Router();

var cfg = ctx.config;

var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');


var process_req = function(req, res ,method) {
  var reqHelper = request.create(req);
  var respHelper = response.create(res);
  var appkey = req.params.akey;
  var ctx = req.context;

  var httpacl = req.context.httpacl;
  //var evp = req.context.evp;
  var jobcaller = req.context.jobcaller;

  var j = httpacl.findJob(appkey,method);

  var topic_prex = 'cmd.execute.';


  j.forEach(function(item){
    var httpdata = {
      'object_type' : 'httpdata',
      'headers': req.headers,
      'method' : method,
      'data' : {}
    }

    if(method=='get'){
      httpdata.data = reqHelper.getQuery();
    }else if(method=='post'){
      httpdata.data = req.body;
    }

    var job_execute_msg = {
      'object_type':'job_execute',
      'source' : 'http_listener',
      'jobId' : '',
      'option' : {},
      'input_data' : {
        'type' : 'bsdata',
        'value' : {
          'object_type':'bsdata',
          'data_type' : 'object',
          'data' : httpdata
        }
      }
    }

    var topic = topic_prex + item.jobid;
    var msg = job_execute_msg;
    msg.jobId = item.jobid;

    jobcaller.send(msg);
    //evp.send(topic,msg);
  });

  if(j.length > 0)
  {
    respHelper.responseOK({'status':'OK'});
  }else{
    respHelper.response403();
  }

}
router.get('/:akey',function(req, res){process_req(req,res,'get')});
router.post('/:akey',function(req, res){process_req(req,res,'post')});


module.exports = router;
