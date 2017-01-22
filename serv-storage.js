var ctx = require('./context');
var StorageService = ctx.getLib('storage-service/main');

var ss = new StorageService(ctx.config);
ss.start();
