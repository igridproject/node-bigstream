var axon = require('axon');
var thunky = require('thunky');

function RPCCaller(config)
{
  this.config = config;
  this.url = config.url;
  this.name = config.name || "rpc_queue";
  this.sock = axon.socket('req');

  var self = this;

  this.opened = false;
  this.open = thunky(open);
  this.open();

  function open (cb) {
    //console.log('OPEN IPC >>>> ' + self.url);
    self.sock.connect(self.url,function(){
      //console.log('OPENED');
      self.opened = true;
      cb();
    });
  }

}

RPCCaller.prototype.call = function(req,cb)
{
  var self = this;
  //console.log('CALLING>>>');
  this.open(()=>{
    self.sock.send(req,(res)=>{
      //console.log(req);
      cb(null,res);
    })
  });
}

RPCCaller.prototype.close = function()
{
  this.sock.close();
}

module.exports = RPCCaller;
