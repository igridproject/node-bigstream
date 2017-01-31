var BSSEngine = require('./bss_engine');

module.exports = BSSPool;
function BSSPool(prm)
{
  this.repos_dir = prm.repos_dir
  this.pool = [];
}

BSSPool.prototype.get = function(name,cb)
{
  var filepath = this.repos_dir + '/' + name2path(name) + '.bss'
  var bssname = name;

  
}

function name2path(name){
  return name.split('.').join('/');
}
