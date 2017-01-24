var ctx = require('../context');
var rpcserver = ctx.getLib('lib/amqp/rpcserver');

module.exports.create = function(cfg)
{
  var ss = new SS(cfg);
  return ss;
}

var SS = function StorageService(cfg)
{
    this.config = cfg;
}

SS.prototype.start = function()
{
  console.log('Starting Storage Service ...\n');
  this.amqp_start();
  this.http_start();
}

SS.prototype.amqp_start = function()
{
  var amqp_cfg = this.config.amqp;

  if(this.amqp_server){return;}

  this.amqp_server = new rpcserver({
                url : amqp_cfg.url,
                name : 'storage_request'
              });
  this.amqp_server.set_remote_function(function(req,callback){
    var n = parseInt(req.t);
    console.log('REQUEST ' + req);
    setTimeout(function(){
              callback(null,{'time':n,'data':req.d});
        },n);
  });

  this.amqp_server.start(function(err){
    if(!err){
      console.log('SS:AMQP START\t\t\t[OK]');
    }else{
      console.log('SS:AMQP START\t\t\t[ERR]');
      console.log(err.message);
    }
  });
}

SS.prototype.http_start = function()
{
  var http = require('http');
  http.createServer(function (req, res) {
      res.writeHead(200, {
          'Content-Type': 'text/plain; charset=UTF-8'
      });
      res.end("req http " + String( (new Date()).getTime() ));

  }).listen(19080, "");
  console.log('SS:DATA_API START\t\t[OK]');
}
