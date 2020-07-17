var ctx = require('./context');
var BSCONFIG = ctx.getConfig();
var SchedulerService = ctx.getLib('coreservice/scheduler');
var StorageEventService = ctx.getLib('coreservice/storage-trigger');

var ss = SchedulerService.create(BSCONFIG);
ss.start();

var ses = StorageEventService.create(BSCONFIG);
ses.start();
