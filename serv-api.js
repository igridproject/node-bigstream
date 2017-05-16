var ctx = require('./context');
var ControllerAPI = ctx.getLib('coreservice/controller-api');

var api = ControllerAPI.create(ctx.config);
api.start();
