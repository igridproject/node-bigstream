var ctx = require('./context');
var StorageService = ctx.getLib('storage-service/main');

var ss = StorageService.create(ctx.config);
ss.start();
