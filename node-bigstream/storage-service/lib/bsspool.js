var BSSEngine = require('./bss_engine');

module.exports = BSSPool;
function BSSPool(prm)
{
  this.repos_dir = prm.repos_dir
  this.pool = [];
}

BSSPool.prototype.get = function(name,cb)
{
  var self=this;
  var filepath = this.repos_dir + '/' + name2path(name) + '.bss'
  var bssname = name;

  var bss = this.search(name);
  if(bss){
    process.nextTick(function() {
      cb(null,bss.engine);
    });
  }else{
    bss = BSSEngine.create(filepath);
    bss.open(function(err){
      if(!err){
        self.pool.push({
          'name' : name,
          'engine':bss
        });
      }
      cb(err,bss);
    });
  }

}

BSSPool.prototype.search = function(name)
{
  var ret=null;
  for(var i=0;i<this.pool.length;i++)
  {
    var bssI = this.pool[i]
    if(bssI.name == name){
      ret = bssI;
      break;
    }
  }

  return ret;
}

function name2path(name){
  return name.split('.').join('/');
}
