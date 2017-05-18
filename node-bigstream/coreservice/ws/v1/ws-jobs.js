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

    jm.getJob({'jid':jid},function (err,jobs){
      if(jobs)
      {
        respHelper.responseOK(jobs);
      }else{
        respHelper.response404('Not found');
      }
    })
});

module.exports = router;
