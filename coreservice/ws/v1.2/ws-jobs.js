var ctx = require('../../../context');

var express = require('express');
var router = express.Router();


var cfg = ctx.config;
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');
var Tokenizer = ctx.getLib('lib/auth/tokenizer');

const ACL_SERVICE_NAME = "job";

router.get('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var jm = req.context.jobManager;
    var acl_validator = req.context.acl_validator;
    var tInfo = Tokenizer.info(req.auth);

    var result=[];
    jm.listJob({},function (err,jobs){
      jobs.forEach(job => {
        var acp = acl_validator.isAccept(tInfo.acl,{
          "vo":tInfo,"service":ACL_SERVICE_NAME,"resource":job,"mode":"l"
        });
        if(acp){
          result.push(job);
        }
      });
      respHelper.responseOK(result);
    });
});

router.get('/:jid',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var jid = req.params.jid;
    var jm = req.context.jobManager;
    var acl_validator = req.context.acl_validator;
    var tInfo = Tokenizer.info(req.auth);

    var acp = acl_validator.isAccept(tInfo.acl,{
      "vo":tInfo.vo,"service":ACL_SERVICE_NAME,"resource":jid,"mode":"r"
    });

    if(!acp){
      return respHelper.response401();
    }

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
    var q = reqHelper.getQuery();
    var jid = req.params.jid;
    var jm = req.context.jobManager;
    var tm = req.context.triggerManager;
    var acl_validator = req.context.acl_validator;
    var tInfo = Tokenizer.info(req.auth);

    var acp = acl_validator.isAccept(tInfo.acl,{
      "vo":tInfo.vo,"service":ACL_SERVICE_NAME,"resource":jid,"mode":"w"
    });

    if(!acp){
      return respHelper.response401();
    }

    jm.deleteJob({'job_id':jid},function(err){
      if(q.reload){
        tm.reload();
      }
      respHelper.response200();
    });
});

router.post('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var q = reqHelper.getQuery();
    var jm = req.context.jobManager;
    var tm = req.context.triggerManager;
    var acl_validator = req.context.acl_validator;
    var tInfo = Tokenizer.info(req.auth);

    var json_job = req.body || {};
    var jid = json_job.job_id || "";
    var acp = acl_validator.isAccept(tInfo.acl,{
      "vo":tInfo.vo,"service":ACL_SERVICE_NAME,"resource":jid,"mode":"w"
    });

    if(!acp){
      return respHelper.response401();
    }

    jm.setJob({'job':json_job,'vo':tInfo.vo},function(err,res){
      if(err)
      {
        respHelper.response400(err);
      }else{
        if(q.reload){
          tm.reload({'vo':tInfo.vo});
        }
        respHelper.response201();
      }
    });

    
});

router.post('/action',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var q = reqHelper.getQuery();
    var jm = req.context.jobManager;
    var tm = req.context.triggerManager;
    var acl_validator = req.context.acl_validator;
    var tInfo = Tokenizer.info(req.auth);

    var acp = acl_validator.isAccept(tInfo.acl,{
      "vo":tInfo.vo,"service":ACL_SERVICE_NAME + '.action',"resource":"","mode":"x"
    });

    if(!acp){
      return respHelper.response401();
    }

    var action = req.body;
    jm.action({'action':action},function(err){
      if(err)
      {
        respHelper.response400(err.message);
      }else{
        if(q.reload){
          tm.reload({'vo':tInfo.vo});
        }
        respHelper.response201();
      }
    });

});

module.exports = router;
