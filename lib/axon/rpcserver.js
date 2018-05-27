var axon = require('axon');
var fs = require('fs');

function RPCServer(config)
{
    this.config = config;
    this.url = config.url;
    this.name = config.name || "rpc_queue";
    this.remote_function = null;
    this.sock = axon.socket('rep');
}

RPCServer.prototype.start = function(cb)
{
  var self = this;
  self.sock.bind(self.url,function(){
      if(typeof cb == 'function'){cb();}
  });

  self.sock.on('message', function(req, reply){
    self.remote_function(req,function(err,resp){
      reply(resp);
    });
  });

}

RPCServer.prototype.set_remote_function = function(func){
  this.remote_function = func;
}

module.exports = RPCServer;
