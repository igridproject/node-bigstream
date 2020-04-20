var fs = require('fs');

var ctx = require('../../context');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var ObjId = ctx.getLib('lib/bss/objid');
var bsdata = ctx.getLib('lib/model/bsdata');
var thunky = require('thunky');

var importer = require('./importer');
var dataevent = require('./dataevent');
var sutils = require('./storage-utils');

module.exports.create = function(prm)
{
  var ins = prm;
  // var bssId = sutils.mkBssId(ins.repos_dir,ins.name,{'newInstance':ins.newInstance});
  // ins.file = bssId.file;
  // ins.serial = bssId.serial;

  return new BSSEngine(ins);
}

function BSSEngine(prm)
{
  var self = this;
  if(typeof prm == 'string'){
    prm = {'file':prm,'context':null};
  }

  this.file = prm.file;
  this.name = prm.name;
  this.context = (prm.context)?prm.context:null;
  this.concurrent = 0;
  this.serial=prm.serial||'';
  this.outdate=false;

  this.bss=null;
  this.open = thunky(openbss);
  this.open();

  function openbss (cb) {

    if(fs.existsSync(self.file))
    {
      open()
    }else{
      BinStream.format(self.file,function(err){
        if(!err){
          open()
        }else{
          cb("format error")
        }
      });
    }
  
    function open(){
      BinStream.open(self.file,function(err,bss){
          if(!err){
            self.bss = bss;
          }
  
          cb(err,bss);
      });
    }

  }

}

BSSEngine.prototype.filepath = function()
{
  return this.file;
}

BSSEngine.prototype.exists = function()
{
  var fp = this.filepath();
  return fs.existsSync(fp);
}

BSSEngine.prototype.close = function(cb)
{
  var self = this;
  self.open((err,bss)=>{
    bss.close(cb);
  });
}


BSSEngine.prototype.cmd = function(cmd,cb)
{
    var self = this
    var command = cmd.command;
    var param = cmd.param;

    switch (command) {
      case 'write':
        self.cmd_write(param,cb);
        break;
      default:
        cb('invalid cmd');
    }
}

BSSEngine.prototype.cmd_write = function(prm,cb)
{
  var self = this;
  var data = parseData(prm.data);
  var meta = prm.meta;

  if(!data){return cb("null data")}

  self.open((err,bss)=>{
    bss.write(data,{'meta':meta},function(err,obj){
      if(!err){
        var head = obj.getHeader();
        var obj_id = new ObjId(head.ID);
        var resp = {
          'resource_id' : obj_id.toString(),
          'storage_name' : self.name
        }
  
        //dataevent.newdata({'resourceId':obj_id.toString(),'storageId':self.name});
        if(self.context){
            newdata_event(self.context,{'resourceId':obj_id.toString(),'storageId':self.name});
        }
  
        cb(null,resp);
      }else {
        cb("write error");
      }
    });

  });

}

function newdata_event(ctx,prm)
{
  var objId = prm.resourceId;
  var storageId = prm.storageId;
  var hostname = ctx.cfg.storage.api_hostname;
  var obj_api_url = hostname + '/v1/object'

  var key = 'storage.' + storageId + '.dataevent.newdata';
  var objMsg = {
      'event' : 'newdata',
      'resourceId' : objId,
      'resource_id' : objId,
      'resource_location' : obj_api_url + '/' + storageId + '.' + objId
  }

  var evp = ctx.evp;
  evp.send(key,objMsg);
}

function parseData(dat)
{
  if(!dat.value){return null}

  var ret;
  if(dat.type && dat.type == 'bsdata')
  {
    var bs = bsdata.parse(dat.value);
    if(bs){
      ret = bs.data;
    }
  }else{
    ret = dat.value;
  }

  return ret;
}
