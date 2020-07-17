var ctx = require('../../../context');

var express = require('express');
var router = express.Router();

var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');
var Tokenizer = ctx.getLib('lib/auth/tokenizer');

const ACL_SERVICE_NAME = "info";

router.get('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);

    var result=ctx.getInfo();

    respHelper.responseOK(result);
});

router.get('/version',function (req, res) {
  var reqHelper = request.create(req);
  var respHelper = response.create(res);

  var info = ctx.getInfo();
  var result=info.version;

  respHelper.responseOK(result);
});


module.exports = router;
