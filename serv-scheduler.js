var ctx = require('./context');
var SchedulerService = ctx.getLib('coreservice/scheduler');
var BSCONFIG = ctx.getConfig();

var ss = SchedulerService.create(BSCONFIG);
ss.start();
