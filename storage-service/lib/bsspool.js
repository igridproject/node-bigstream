var BSSEngine = require('./bss_engine');

module.exports = BSSPool;
function BSSPool(prm)
{
  this.repos_dir = prm.repos_dir
  this.context = prm.context;
  this.pool = [];
  this.size = 32;
}

BSSPool.prototype.get = function(name,cb)
{
  var self=this;
  var filepath = this.repos_dir + '/' + name2path(name) + '.bss'
  var bssname = name;

  var bss = this.search(name);
  if(bss){
    self.clean(function(err){
      process.nextTick(function() {
        cb(null,bss.engine);
      });
    });
  }else{
    bss = BSSEngine.create({'context':self.context,'file' : filepath,'name' : bssname});
    bss.open(function(err){
      if(!err){
        self.pool.push({
          'name' : name,
          'engine':bss
        });
      }
      self.clean(function(err){
        cb(err,bss);
      });
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
  // for(var i=0;i<this.pool.length;i++)
  // {
  //   var bssI = this.pool[i];
  //   if(bssI.name == name){
  //     ret = bssI;
  //     break;
  //   }
  // }

  return ret;
}

function name2path(name){
  return name.split('.').join('/');
}
