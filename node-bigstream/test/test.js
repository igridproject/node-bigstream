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

var Db = ctx.getLib('storage-service/lib/db');

var database = Db.create({'repos_dir':'D:/testfile'});

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
var cluster = require('cluster');
var http = require('http');
var numCPUs = 4;

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
  console.log('process ' + process.pid + ' says hello!');

    http.createServer(function(req, res) {

        res.writeHead(200);
        res.end('process ' + process.pid + ' says hello!');
    }).listen(8000);
}
