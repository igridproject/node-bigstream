var fs = require('fs');
var BSSPool = require('./bsspool');
var StorageIndexstore = require('./storage-indexstore')

module.exports.create = function(cfg){
  return new Db(cfg);
}

function Db(cfg)
{
  this.repos_dir = cfg.repos_dir;
  this.context = cfg.context;
  this.mem = cfg.redis;

  this.idxstore = new StorageIndexstore({'mem':this.mem });
  this.bsspool = new BSSPool({'repos_dir':this.repos_dir,'context':this.context});
  
}

Db.prototype.request = function(req,cb)
{
  if(req.object_type!='storage_request'){
    return cb(null,result_error('invalid request'));
  }

  var cmd = req.command;
  switch (cmd) {
    case 'write':
      var prm = req.param
      this.bsscmd_w(prm,cb)
      break;
    case 'delete':
      var prm = req.param
      this.bsscmd_del(prm,cb)
      break;
    case 'idxget':
      var prm = req.param
      this.cmd_idxget(prm,cb)
      break;
    default:
      cb(null,result_error('invalid command'));
  }


}

Db.prototype.cmd_idxget = function(prm,cb)
{
  var self = this;
  var storage_name = prm.storage_name;
  var key = prm.key;

  self.idxstore.getIndex(storage_name,key,(err,val)=>{
    if(!err && val){
      cb(null,result_ok({'found':true,'object_id':val}));
    }else{
      cb(null,result_ok({}))
    }
  });
}

Db.prototype.bsscmd_w = function(prm,cb)
{
    var self = this;
    var filepath = this.repos_dir + '/' + name2path(prm.storage_name) + '.bss';
    var bssname = prm.storage_name;
    var metadata = prm.meta;
    var w_cmd = {
      'command' : 'write',
      'param' : {
        'meta' : prm.meta,
        'data' : prm.data
      }
    }

    var bss_opt = {};
    if(prm.opt && prm.opt.overwrite){bss_opt.newInstance=true;}

    self.bsspool.get(bssname,bss_opt,function(err,bss){
      if(!err){
        bss.cmd(w_cmd,function(err,resp){
          if(!err){
            indexing(metadata,resp.resource_id,(err)=>{
              cb(null,result_ok(resp));
            })
          }else{
            cb(null,result_error('write error'));
          }
        });
      }else{
        cb(null,result_error('bss error'));
      }
    });

    function indexing(meta,objid,cb)
    {
      if(meta && meta._key && typeof meta._key == 'string'){
        self.idxstore.setIndex(bssname,meta._key,objid,cb);
      }else{
        cb(null);
      }
    }
}

Db.prototype.bsscmd_del = function(prm,cb)
{
  var self = this;
  var filepath = this.repos_dir + '/' + name2path(prm.storage_name) + '.bss';
  var bssname = prm.storage_name;

  var bssI = self.bsspool.detach(bssname);
  if(bssI){
    bssI.engine.close((err)=>{
      if(!err){
        self.idxstore.flush(bssname);
        unlink(filepath,cb);
      }else{
        cb(null,result_error('delete error'));
      }
    });
  }else{
    unlink(filepath,cb);
  }

  function unlink(fd,callback)
  {

    fs.exists(fd,function(exists){
      if(exists){

        fs.unlink(fd,function(err){
          if(!err){
            callback(null,result_ok());
          }else{
            callback(null,result_error('delete error'));
          }
        });

      }else{
        callback(null,result_error('storage not found'));
      }
    });

  }
}

function name2path(name){
  return name.split('.').join('/');
}

function result_error(msg,code)
{
  return {'status':'ERR','msg':msg,'code':code}
}

function result_ok(resp)
{
  return {'status':'OK','resp':resp}
}
