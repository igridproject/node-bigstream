// var axon = require('axon');
// var sock = axon.socket('pull');
//
// sock.connect('tcp://127.0.0.1:3333');
//
// sock.on('message', function(msg){
//   console.log(msg);
// });

// var axon = require('axon');
// var sock = axon.socket('req');
//
// sock.connect('tcp://127.0.0.1:3333',function(){
//   var img = {
//     'n' : Math.random().toString()
//   }
//
//   console.log('Send ' + img.n);
//   sock.send(img, function(res){
//     console.log(res.n);
//     sock.close();
//   });
// });

// var img = {
//   'n' : Math.random().toString()
// }
//
// console.log('Send ' + img.n);
// sock.send(img, function(res){
//   console.log(res.n);
//   //sock.close();
// });

// setTimeout(function(){
//   sock.send({
//     'n' : '2'
//   }, function(res2){
//     console.log('2 ' + res2.n);
//     //sock.close();
//   });
// },1000);
//
//
//
// sock.send({
//   'n' : '3'
// }, function(res3){
//   console.log('3 ' + res3.n);
//   //sock.close();
// });

var ctx = require('../../context');
var RPCCaller = ctx.getLib('lib/axon/rpccaller');

var caller = new RPCCaller({
  url : ctx.getUnixSocketUrl('test.sock'),
  name :'storage_request'
});

var img = {
  'n' : Math.random().toString()
}

req = {
    'object_type' : 'storage_request',
    'command' : 'writex',
    'param' : {
      'storage_name' : "test",
      'meta' : {},
      'data' : {
        'type' : 'bsdata',
        'value' : {}
      }
    }
  }

console.log('Send ');
caller.call(req, function(err,res){
  console.log(res);
  //caller.close();
});
