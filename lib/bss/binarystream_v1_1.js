var randomAccessFile = require('random-access-file');
var async = require('async');
var BSON = require('buffalo');
var ObjectId = BSON.ObjectId;

var fileAccessBuffer = require('./file-access-buffer');
var Root = require('./root');
var ObjectData = require('./objectdata');
var ObjId = require('./objid');
var Oat = require('./oat');
var Reader = require('./reader');

var quickq = require('quickq');

const VERSION = "1.0";

const ROOTSIZE = 256;
const OATSLOT = 10000;
const OATMETASIZE = 100;
const HEADERSIZE = 80;

const STRING_TYPE = 1;
const BINARY_TYPE = 2;
const OBJECT_TYPE = 3;

module.exports.STRING_TYPE = STRING_TYPE;
module.exports.BINARY_TYPE = BINARY_TYPE;
module.exports.OBJECT_TYPE = OBJECT_TYPE;

module.exports.format = function(filename,opt,cb){
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

    var prm = {};
    if(options.hashnumber && options.hashnumber instanceof Buffer){
        prm.FHN = options.hashnumber;
    }

    var fd = fileAccessBuffer.create(filename,{truncate: true});
    var root = new Root(fd);
    root.newroot(prm);
    root.write(cb);
};

module.exports.open = function(filename,opt,cb){
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var inst = new Storage(filename,options);
  inst.open(cb);
}

function Storage(filename,opt)
{
    this.options = opt;
    this.filename = filename;
    this.write_queue = quickq(io_write,{ concurrency: 1 });
}

Storage.prototype.open = function(cb)
{
  var self = this;
  if(this.root){return cb(new Error('Already opened'));}

  var fileOpt = null;
  this.file = fileAccessBuffer.create(this.filename,fileOpt);
  self.root = new Root(self.file);
  self.root.load(function(err,obj){
      cb(err,self);
  });
  // this.file.open(function(err){
  //
  //   self.root = new Root(self.file);
  //   self.root.load(function(err,obj){
  //       cb(err,self);
  //   });
  //
  // });
}

Storage.prototype.write = function(data,opt,cb)
{
  var prm = {'data':data,'opt':opt,'self':this}

  this.write_queue.push(prm,cb);
}

var io_write = function(prm,cb)
{
  var data = prm.data;
  var opt = prm.opt;
  var self = prm.self;

  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var rootData = self.root.data;

  var nSeq = rootData.SEQ+1;
  var nFhn = rootData.FHN;

  var oid = new ObjId({'fhn':nFhn,'seq':nSeq});
  var objData = ObjectData.createByData(self.file,{
                  id:oid.bytes,
                  data:data,
                  meta:options.meta
                })

  if(!objData){
    return cb(new Error('Data error'));
  }

  var slotNo = rootData.SEQ%rootData.OATZ;

  async.waterfall(
    [
      function(callback){
        //make oat buffer
        if(rootData.SEQ == 0){
          //First OAT
          self.lastOat = Oat.create(self.file,
                                    {
                                      'address':rootData.AOF,
                                      'SEQ':1,
                                    });
          rootData.OATA = self.lastOat.address;
          rootData.AOF = rootData.AOF + self.lastOat.getSize();
          self.lastOat.writeMeta(function(err){
            callback(err,true);
          })
        }else if(!self.lastOat){
          //load last Oat
          Oat.load(self.file,rootData.OATA,function(err,oat){
            self.lastOat = oat;
            callback(err,false);
          })
        }else{
          callback(null,false);
        }
        ///end make oat
      },
      function(first,callback){
        //new oat table
        if(!first && slotNo==0){
          var nextOat = Oat.create(self.file,
                                    {
                                      'address':rootData.AOF,
                                      'SEQ':self.lastOat.oatmeta.SEQ + 1,
                                      'PREV':self.lastOat.address
                                    });
          rootData.OATA = nextOat.address;
          rootData.AOF = rootData.AOF + nextOat.getSize();
          self.lastOat.setNextAddr(nextOat.address);
          nextOat.writeMeta(function(err){
            if(err){
              callback(err);
            }else{
              self.lastOat.writeMeta(function(err){
                self.lastOat = nextOat;
                callback(err);
              })
            }
          })

        }else{
          callback(null);
        }
      },
      function(callback){
        //write oat slot
        objData.setAddress(rootData.AOF);
        self.lastOat.writeSlot(slotNo,objData.getHeader(),function(err){
          callback(err);
        });
      },
      function(callback){
        //update root
        rootData.AOF = rootData.AOF + objData.getObjectSize();
        rootData.SEQ = nSeq;
        self.root.write(function(err){
          callback(err);
        })
      },
      function(callback){
        //write data
        objData.write(function(err){
          callback(err,objData);
        });
      }

    ],
    function(err){
      cb(err,objData);
    }
  );

}

Storage.prototype.reader = function(prm){
  var prm = prm || {};
  var rd = new Reader(this.file,this.root);

  return rd;
}

Storage.prototype.close = function(cb){
    this.file.close(cb);
};
