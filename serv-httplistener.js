var ctx = require('./context');
var HTTPListener = ctx.getLib('http-listener/main');
var BSCONFIG = ctx.getConfig();

var hs = HTTPListener.create(BSCONFIG);
hs.start();
