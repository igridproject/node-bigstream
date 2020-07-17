var ctx = require('./context');
var BSCONFIG = ctx.getConfig();
var ControllerAPI = ctx.getLib('coreservice/controller-api');

var api = ControllerAPI.create(BSCONFIG);
api.start();
