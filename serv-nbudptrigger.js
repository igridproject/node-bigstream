var ctx = require('./context');
var NBUdpTrigger = ctx.getLib('triggers/trg-nbudp');

var trg = NBUdpTrigger.create(ctx.config);
trg.start();
