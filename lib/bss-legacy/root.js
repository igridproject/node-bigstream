var BSON = require('buffalo');

const ROOTSIZE = 256;
const VERSION = "1.0";
const OATSIZE = 10000;

var root_struct = function (){
  //   return {
  //      "VER":VERSION,
  //      "FHN":new Buffer(4),
  //      "SEQ":0,
  //      "OATA":0,
  //      "OATZ":OATSIZE,
  //      "AOF":ROOTSIZE
  //  };
   return JSON.parse(JSON.stringify({
    "VER":VERSION,
    "FHN":Buffer.alloc(4),
    "SEQ":0,
    "OATA":0,
    "OATZ":OATSIZE,
    "AOF":ROOTSIZE
  }));
}

module.exports = Root;
function Root(fd,opt)
{
  this.options = opt || {};
  this.file = fd;
  this.data = null;
}

Root.prototype.setVal = function(name,val){
  this.data[name] = val;
}

Root.prototype.getVal = function(name){
  return this.data[name] = val;
}

Root.prototype.getRoot = function(){
  return this.data;
}

Root.prototype.newroot = function(prm){
  prm = prm || {};
  this.data = root_struct();
  if(prm.FHN){
    this.data.FHN = prm.FHN;
  }
}

Root.prototype.load = function(cb){
  var self = this;
  this.file.read(0, ROOTSIZE-1, function(err, buffer) {
    if(!err){
        var objroot = BSON.parse(buffer);
        self.data = objroot;
    }
    cb(err,objroot);
  });
}

Root.prototype.write = function(cb){
  //var buffer = new Buffer(ROOTSIZE);
  var buffer = Buffer.alloc(ROOTSIZE);
  BSON.serialize(this.data,buffer);
  this.file.write(0,buffer,cb);
}
