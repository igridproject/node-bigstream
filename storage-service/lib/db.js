var BSSPool = require('./bsspool');

module.exports.create = function(cfg){
  return new Db(cfg);
}

function Db(cfg)
{
  this.repos_dir = cfg.repos_dir;

  this.bsspool = new BSSPool({'repos_dir':this.repos_dir});
}

Db.prototype.request = function(req,cb)
{
  if(req.object_type!='storage_request'){
    return cb(null,result_error('invalid request'));
  }

  var cmd = req.command;
  switch (cmd) {
    case 'write':
      var prm_w = {
        'storage' : req.storage_name,
        'meta' : req.meta,
        'data' : req.resource.value
      }
      this.bsscmd_w(prm_w,cb)
      break;
    default:
      cb(null,result_error('invalid command'));
  }


}

Db.prototype.bsscmd_w = function(cmd,cb)
{
    var self = this;
    var filepath = this.repos_dir + '/' + name2path(cmd.storage) + '.bss'
    var bssname = cmd.storage;
    var w_cmd = {
      'command' : 'write',
      'param' : {
        'meta' : cmd.meta,
        'data' : cmd.data
      }
    }

    this.bsspool.get(bssname,function(err,bss){
      if(!err){
        bss.cmd(w_cmd,function(err){
          if(!err){
            cb(null,result_ok('success'));
          }else{
            cb(null,result_error('write error'));
          }
        });
      }else{
        cb(null,result_error('bss error'));
      }
    });
}


function name2path(name){
  return name.split('.').join('/');
}

function result_error(msg)
{
  return {'status':'ERR','msg':msg}
}

function result_ok(msg)
{
  return {'status':'OK','msg':msg}
}
