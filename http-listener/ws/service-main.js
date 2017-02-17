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

    respHelper.responseOK({'status':'OK','appkey':appkey});

});

module.exports = router;
