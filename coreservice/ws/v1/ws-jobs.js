var ctx = require('../../../context');

var express = require('express');
var router = express.Router();


var cfg = ctx.config;
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');

router.get('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var jm = req.context.jobManager;

    jm.listJob({},function (err,jobs){
      respHelper.responseOK(jobs);
    })
});

router.get('/:jid',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var jid = req.params.jid;
    var jm = req.context.jobManager;

    jm.getJob({'job_id':jid},function (err,jobs){
      if(jobs)
      {
        respHelper.responseOK(jobs);
      }else{
        respHelper.response404('Not found');
      }
    })
});

router.delete('/:jid',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);

    var jid = req.params.jid;
    var jm = req.context.jobManager;

    jm.deleteJob({'job_id':jid},function(err){
      respHelper.response200();
    });
});

router.post('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var q = reqHelper.getQuery()
    var jm = req.context.jobManager;
    var tm = req.context.triggerManager;

    var json_job = req.body;

    jm.setJob({'job':json_job},function(err,res){
      if(err)
      {
        respHelper.response400(err);
      }else{
        if(q.reload){
          tm.reload();
        }
        respHelper.response201();
      }
    });

});

module.exports = router;
