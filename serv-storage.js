var ctx = require('./context');
var StorageService = ctx.getLib('storage-service/main');

var argv = require('minimist')(process.argv.slice(2));


//ss.start();
var m = {'read':"false",'write':"false"}
if(argv['process-read']){m.read = "true";}
if(argv['process-write']){m.write = "true";}
if(argv['api-port']){ctx.config.storage.api_port = Number(argv['api-port']);}

//console.log(argv);
var ss = StorageService.create(ctx.config);

if(m.read=="false" && m.write=="false")
{
  ss.start();
}else{
  if(m.read=="true"){ss.http_start();}
  if(m.write=="true"){
    ss.amqp_start();
    //Disable IPC Feature
    //ss.ipc_start();
  }
}
