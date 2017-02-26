var ctx = require('../../context');

var express = require('express');
var router = express.Router();

var cfg = ctx.config;
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');


router.get('/:akey',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var appkey = req.params.akey;
    var ctx = req.context;

    var httpacl = req.context.httpacl;
    var evp = req.context.evp;

    var j = httpacl.findJob(appkey,'get');
    respHelper.responseOK({'status':'OK','appkey':appkey,'res':j});
});
module.exports = router;
