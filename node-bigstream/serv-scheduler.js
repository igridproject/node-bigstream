var ctx = require('./context');
var SchedulerService = ctx.getLib('coreservice/scheduler');

var ss = SchedulerService.create(ctx.config);
ss.start();
