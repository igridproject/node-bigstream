var ctx = require('./context');
var SchedulerService = ctx.getLib('coreservice/scheduler');
var StorageEventService = ctx.getLib('coreservice/storage-trigger');

var ss = SchedulerService.create(ctx.config);
ss.start();

var ses = StorageEventService.create(ctx.config);
ses.start();
