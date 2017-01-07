var ctx = require('../context');
var amqp_cfg = ctx.config.amqp;

var rpcserver = ctx.getLib('lib/amqp/rpcserver');

var server = new rpcserver({
              url : amqp_cfg.url,
            });

server.set_remote_function(function(req,callback){
  var n = parseInt(req.t);
  console.log('REQUEST ' + req);
  setTimeout(function(){
            callback(null,{'time':n,'data':req.d});
      },n);
})

server.start(function(err){
  console.log('server start');
})

var http = require('http');
http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=UTF-8'
    });

    res.end('Hello from node-bigstream.\n');

}).listen(9080, "");
