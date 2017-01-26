var ctx = require('../context');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var path = require('path');

function BSSHandler(prm)
{
  this.repos_dir = prm.repos_dir;
  this.name = prm.name;
}

BSSHandler.prototype.filepath = function()
{
  return this.repos_dir + '/' + this.name + '.bss';
}

BSSHandler.prototype.exists = function()
{
  var fp = this.filepath();
  return path.existsSync(fp);
}

BSSHandler.prototype.open = function()
{
  
}
