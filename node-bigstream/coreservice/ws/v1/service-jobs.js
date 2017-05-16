var ctx = require('../../../context');

var express = require('express');
var router = express.Router();


var cfg = ctx.config;

var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');


router.get('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var jid = req.params.id;

    //get_object(reqHelper,respHelper,jid);
    respHelper.responseOK({'status':'OK'});
});


module.exports = router;
