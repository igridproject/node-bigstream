var ctx = require('./context');
var JobWorker = ctx.getLib('jobworker/worker');
var BSCONFIG = ctx.getConfig();

var worker = JobWorker.create({'config':BSCONFIG,'name':'worker'});
worker.start();
