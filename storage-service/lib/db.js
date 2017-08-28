var BSSPool = require('./bsspool');

module.exports.create = function(cfg){
  return new Db(cfg);
}

function Db(cfg)
{
  this.repos_dir = cfg.repos_dir;
  this.context = cfg.context;

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
    default:
      cb(null,result_error('invalid command'));
  }


}

Db.prototype.bsscmd_w = function(prm,cb)
{
    var self = this;
    var filepath = this.repos_dir + '/' + name2path(prm.storage_name) + '.bss';
    var bssname = prm.storage_name;
    var w_cmd = {
      'command' : 'write',
      'param' : {
        'meta' : prm.meta,
        'data' : prm.data
      }
    }

    this.bsspool.get(bssname,function(err,bss){
      if(!err){
        bss.cmd(w_cmd,function(err,resp){
          if(!err){
            cb(null,result_ok(resp));
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

function result_ok(resp)
{
  return {'status':'OK','resp':resp}
}
