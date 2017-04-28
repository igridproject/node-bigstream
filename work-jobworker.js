var ctx = require('./context');
var JobWorker = ctx.getLib('jobworker/worker');

var worker = JobWorker.create({'config':ctx.config,'name':'worker'});
worker.start();
