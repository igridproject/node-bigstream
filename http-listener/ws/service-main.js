var ctx = require('../../context');

const uuid = require('uuid');
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

  var session_id = uuid.v4()
  var httpacl = req.context.httpacl;
  //var evp = req.context.evp;
  var jobcaller = req.context.jobcaller;

  var j = httpacl.findJob(appkey,method);

  var topic_prex = 'cmd.execute.';

  var resp_msg = {'status':'OK'}

  j.forEach(function(item){
    var httpdata = {
      'object_type' : 'httpdata',
      'headers': req.headers,
      'method' : method,
      'query' : reqHelper.getQuery(),
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
      'input_meta' : {'_sid':session_id},
      'input_data' : {
        'type' : 'bsdata',
        'value' : {
          'object_type':'bsdata',
          'data_type' : 'object',
          'data' : httpdata
        }
      }
    }

    if(item.opt && item.opt.session){ resp_msg.session=session_id }

    var msg = job_execute_msg;
    msg.jobId = item.jobid;

    jobcaller.send(msg);
  
  });

  if(j.length > 0)
  {
    respHelper.responseOK(resp_msg);
  }else{
    respHelper.response403();
  }

}

router.get('/:akey',function(req, res){process_req(req,res,'get')});
router.post('/:akey',function(req, res){process_req(req,res,'post')});


module.exports = router;
