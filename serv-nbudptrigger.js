var ctx = require('./context');
var NBUdpTrigger = ctx.getLib('triggers/trg-nbudp');
var BSCONFIG = ctx.getConfig();

var trg = NBUdpTrigger.create(BSCONFIG);
trg.start();
