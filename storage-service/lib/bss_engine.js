var fs = require('fs');
var ctx = require('../../context');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');

var importer = require('./importer');

module.exports.create = function(prm)
{
  return new BSSEngine(prm);
}

function BSSEngine(prm)
{
  if(typeof prm == 'string'){
    prm = {'file':prm};
  }
  // this.repos_dir = prm.repos_dir;
  // this.name = prm.name;
  this.file = prm.file;
  this.concurrent = 0;
}

BSSEngine.prototype.filepath = function()
{
  //return this.repos_dir + '/' + name2path(this.name) + '.bss';
  return this.file;
}

BSSEngine.prototype.exists = function()
{
  var fp = this.filepath();
  return fs.existsSync(fp);
}

BSSEngine.prototype.open = function(cb)
{
  var self = this;

  if(self.exists())
  {
    open()
  }else{
    BinStream.format(self.filepath(),function(err){
      if(!err){
        open()
      }else{
        cb("format error")
      }
    });
  }

  function open(){
    BinStream.open(self.filepath(),function(err,bss){
        if(!err){
          self.bss = bss;
        }

        cb(err);
    });
  }

}

BSSEngine.prototype.close = function(cb)
{
  this.bss.close(cb);
}


BSSEngine.prototype.cmd = function(cmd,cb)
{
    var command = cmd.command;
    var param = cmd.param;

    switch (command) {
      case 'write':
        this.cmd_write(param,cb);
        break;
      default:
        cb('invalid cmd');
    }
}

BSSEngine.prototype.cmd_write = function(prm,cb)
{
  var data = prm.data;
  var meta = prm.meta;

  this.bss.write(data,{'meta':meta},function(err,obj){
    if(!err){
      cb("write error");
    }else {
      cb(null);
    }
  });
}
