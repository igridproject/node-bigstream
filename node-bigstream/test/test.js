var ctx = require('../context');
// var BSData = ctx.getLib('lib/model/bsdata');

//var data = new Buffer('hello')
// var data = "hello\nworld"
//
// var bsdata = BSData.create(data);
//
// var sel = bsdata.serialize('object');
//
// console.log(sel.data);

var uuid = require('node-uuid');

// console.log(uuid.v1());
//
const crypto = require("crypto");
//
//
//
// const id = crypto.randomBytes(16).toString("hex");
//
// console.log(id);

// var bss_handler = ctx.getLib('storage-service/lib/bss_engine');
//
// var bss = bss_handler.create('d:/testfile/new/slash/hnd.bss');
// bss.open(function(err){
//   console.log('open');
// });

//var Db = ctx.getLib('storage-service/lib/db');

//var database = Db.create({'repos_dir':'D:/testfile'});

// var req = {
//     'object_type' : 'storage_request',
//     'command' : 'write',
//     'storage_name' : 'gcs.file.test',
//     'meta' : {'name':'gcs'},
//     'resource' : {
//       'value' : 'Kamron Aroonrua'
//     }
// }

// var req = {
//     'object_type' : 'storage_request',
//     'command' : 'write',
//     'param' : {
//       'storage_name' : 'gcs.file.test',
//       'meta' : {'name':'gcs'},
//       'data' : {
//         'type' : 'bsdata',
//         'value' : {
//           'data_type' : 'string',
//           'data' : 'AA00FFCC'
//         }
//       }
//     }
// }
//
// database.request(req,function(err,res){
//   console.log(res);
// });

// var Redis = require("ioredis");
// var redis = new Redis({
//   port: 6379,          // Redis port
//   host: 'lab1.igridproject.info',   // Redis host
//   db: 0
// })

// var redis = new Redis('redis://:@lab1.igridproject.info:6379/4')
// var a = [];
// a.push({'appkey':'test-igrid','method':'get','jobid':'igrid'});
// a.push({'appkey':'ibitz-test','method':'get','jobid':'ibitz'});

// atext = JSON.stringify(a);
// redis.set('a',atext)

// var HttpACL = ctx.getLib('lib/mems/http-acl');
//
// var httpacl = HttpACL.create({'conn':'redis://:@bigmaster.igridproject.info:6379/1'});
//
// httpacl.add({'appkey':'app1','method':'get','jobid':'job1'})
// httpacl.add({'appkey':'app2','method':'get','jobid':'job2'})
// httpacl.add({'appkey':'app1','method':'get','jobid':'job3'})
// httpacl.commit();
//
// httpacl.update(function(err){
//   //console.log(httpacl.acl);
//   var j = httpacl.findJob('app1','get');
//   console.log(j);
// });

// var EvenPub = ctx.getLib('lib/amqp/event-pub');
//
// var evp = new EvenPub({'url':'amqp://bigmaster.igridproject.info','name':'topic_logs'});
//
// evp.send('q.test.t1','kamron aroonrua');
// evp.send('q.test.t1','kamron aroonrua aaa');
//
// setTimeout(function() { evp.close(function(err){console.log('close');}); }, 1500);

// var EvenSub = ctx.getLib('lib/amqp/event-sub');
//
// var evs = new EvenSub({'url':'amqp://bigmaster.igridproject.info','name':'bs_storage'});
//
// evs.sub('storage.sds.#',function(err,msg){
//   console.log(msg);
// });

var memstore = ctx.getLib('jobexecutor/lib/memstore');

var ms = new memstore({'job_id':'job01','cat':'global','conn':'redis://:@bigmaster.igridproject.info:6379/1'})

var txt = "kamron\naroonrua"

ms.setItem('test1',{'t':txt});
ms.getItem('test1',function(err,val){
  console.log(val.t);
});
