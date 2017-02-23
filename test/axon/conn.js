// var axon = require('axon');
// var sock = axon.socket('pull');
//
// sock.connect('tcp://127.0.0.1:3333');
//
// sock.on('message', function(msg){
//   console.log(msg);
// });

var axon = require('axon');
var sock = axon.socket('req');

sock.connect('tcp://127.0.0.1:3333');

var img = {
  't' : 'hello'
}
sock.send(img, function(res){
  console.log(res);
});
