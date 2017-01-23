var ctx = require('../context');
var rpcserver = ctx.getLib('lib/amqp/rpcserver');

module.exports = StorageService;
function StorageService(cfg)
{
    this.config = cfg;
}

StorageService.prototype.start = function()
{
  console.log('Starting Storage Service ...\n');
  amqp_start(this.config);
  http_start(this.config);
}

function amqp_start(cfg)
{
  var amqp_cfg = cfg.amqp;

  var server = new rpcserver({
                url : amqp_cfg.url,
                name : 'storage_request'
              });
  server.set_remote_function(function(req,callback){
    var n = parseInt(req.t);
    console.log('REQUEST ' + req);
    setTimeout(function(){
              callback(null,{'time':n,'data':req.d});
        },n);
  })

  server.start(function(err){
    if(!err){
      console.log('AMQP START\t\t\t[OK]');
    }
  });
}

function http_start(cfg)
{
  var http = require('http');
  http.createServer(function (req, res) {
      res.writeHead(200, {
          'Content-Type': 'text/plain; charset=UTF-8'
      });
      res.end("req http " + String( (new Date()).getTime() ));

  }).listen(9080, "");
}
