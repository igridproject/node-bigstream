var ctx = require('./context');
var HTTPListener = ctx.getLib('http-listener/main');

var hs = HTTPListener.create(ctx.config);
hs.start();
