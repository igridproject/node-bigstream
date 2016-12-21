var async = require('async');
var BSON = require('buffalo');
var ObjId = BSON.ObjectId;

var Oat = require('./oat');
var ObjectData = require('./objectdata');
var ObjId = require('./objid');

module.exports = Writer;
function Writer(fd,root,opt){
  this.file = fd;
  this.root = root;
}

Writer.prototype.write = function(data,opt,cb){
  var self = this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var nSeq = ++this.root.SEQ;
  var nFhn = this.root.FHN;

  var id = new ObjId({'fhn':nFhn,'seq':nSeq})

  console.log(id.toString());
}
