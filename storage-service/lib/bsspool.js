var BSSEngine = require('./bss_engine');

module.exports = BSSPool;
function BSSPool(prm)
{
  this.repos_dir = prm.repos_dir
  this.context = prm.context;
  this.pool = [];
  this.size = 32;
}

BSSPool.prototype.get = function(name,opt,cb)
{
  if(!cb){cb=opt;opt={};}
 
  var self=this;
  var filepath = this.repos_dir + '/' + name2path(name) + '.bss'
  var bssname = name;

  var bss = this.search(name);
  if(bss && !opt.newInstance){
    self.clean(function(err){
      process.nextTick(function() {
        cb(null,bss.engine);
      });
    });
  }else{
    var bss_engine = BSSEngine.create(
                                { 'context':self.context,
                                  'repos_dir':self.repos_dir,
                                  'file' : filepath,
                                  'name' : bssname,
                                  'newInstance':opt.newInstance
                                });
    self.pool.push({
      'name' : name,
      'engine':bss_engine
    });
    self.clean(function(err){
      cb(err,bss_engine);
    });

  }

}

BSSPool.prototype.clean = function(cb)
{
  if(this.size<2){this.size=2}
  if(this.pool.length>this.size)
  {
    var garb = this.pool.shift();
    garb.engine.close(cb);
    console.log('SS :: release storage >> ' + garb.name);
  }else{
    cb();
  }
}

BSSPool.prototype.search = function(name)
{
  var ret=null;
  var newpool=[];

  this.pool.forEach((bssI)=>{
    if(bssI.name == name){
      ret = bssI;
    }else{
      newpool.push(bssI)
    }
  });

  if(ret){newpool.push(ret)}
  this.pool = newpool;

  return ret;
}

BSSPool.prototype.detach = function(name)
{
  var ret=null;
  var newpool=[];

  this.pool.forEach((bssI)=>{
    if(bssI.name == name){
      ret = bssI;
    }else{
      newpool.push(bssI)
    }
  });

  this.pool = newpool;

  return ret;
}

function name2path(name){
  return name.split('.').join('/');
}
