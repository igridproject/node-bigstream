var BSON = require('buffalo');
var async = require('async');

const OATMETASIZE = 64;
const OBJHEADERSIZE = 80;


//OAT Header structure
var oatmeta_struct = function(){
  return {
    "SEQ" : 0,
    "SZ" : 10000,
    "PREV" : null,
    "NEXT" : null,
  }
}

var create = module.exports.create = function(fd,prm,opt){
  var oatmeta = oatmeta_struct();
  oatmeta.SEQ = (prm.SEQ)?prm.SEQ:1;
  oatmeta.SZ = (prm.SZ)?prm.SZ:10000;
  oatmeta.PREV = (prm.PREV)?prm.PREV:null;
  oatmeta.NEXT = (prm.NEXT)?prm.NEXT:null;

  var address = prm.address;

  return new Oat(fd,address,oatmeta,opt);
};

module.exports.load = function(fd,address,opt,cb){
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  fd.read(address, OATMETASIZE, function(err, buffer) {
    var oatmeta = null;
      if(!err){
          oatmeta = BSON.parse(buffer);
          var inst = new Oat(fd,address,oatmeta,options);
      }
      cb(err,inst);
  });

}

function Oat(fd,addr,meta,opt){
  this.options = opt || {};
  this.file = fd;
  this.slotbuffer = null;

  this.address = addr;
  this.oatmeta = meta;
}

Oat.prototype.setNextAddr = function(addr){
  this.oatmeta.NEXT = addr;
}

Oat.prototype.oatAt = function(seq,cb){
  var self=this;
  var curSeq = this.oatmeta.SEQ;
  var curOat = this;

  if(seq>curSeq){
    //forward
    async.whilst(
        function() { return ((curOat!=null) && (seq>curSeq)); },
        function(callback) {
            curOat.nextOat(function(err,oat){
              curOat = oat;
              if(curOat){
                curSeq = oat.oatmeta.SEQ;
                callback(err,curOat);
              }else{
                callback(null,null);
              }
            });
        },
        function (err, oat) {
            cb(err,oat);
        }
    );
  }else if(seq<curSeq){
    //backward
    async.whilst(
        function() { return ((curOat!=null) && (seq<curSeq)); },
        function(callback) {
            curOat.prevOat(function(err,oat){
              curOat = oat;
              if(curOat){
                curSeq = oat.oatmeta.SEQ;
                callback(err,curOat);
              }else{
                callback(null,null);
              }
            });
        },
        function (err, oat) {
            cb(err,oat);
        }
    );

  }else{
    callback(null,curOat);
  }

}

Oat.prototype.nextOat = function(cb){
  if(!this.oatmeta.NEXT){
    return cb(null,null);
  }

  var inst = new Oat(this.file,this.oatmeta.NEXT);
  inst.readMeta(function(err){
    if(!err){
      cb(null,inst);
    }else{
      cb(err);
    }
  })
}

Oat.prototype.prevOat = function(cb){
  if(!this.oatmeta.PREV){
    return cb(null,null);
  }

  var inst = new Oat(this.file,this.oatmeta.PREV);
  inst.readMeta(function(err){
    if(!err){
      cb(null,inst);
    }else{
      cb(err);
    }
  })
}

Oat.prototype.readMeta = function(cb){
  var self = this;
  this.file.read(this.address, OATMETASIZE, function(err, buffer) {
      if(!err){
          self.oatmeta = BSON.parse(buffer);
      }
      cb(err);
  });
}

Oat.prototype.writeMeta = function(cb){
  var buffer = new Buffer(OATMETASIZE);
  BSON.serialize(this.oatmeta,buffer);
  this.file.write(this.address,buffer,cb);
}

Oat.prototype.writeSlot = function(index,data,cb){
  if(index>=this.oatmeta.SZ){
    return cb(new Error("Index out of bound"));
  }
  var slotAddr = this.address + OATMETASIZE + (index*OBJHEADERSIZE);
  var buffer = new Buffer(OBJHEADERSIZE);
  BSON.serialize(data,buffer);
  this.file.write(slotAddr,buffer,cb);
}

Oat.prototype.readSlot = function(index,opt,cb){
  self=this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  if(index>=this.oatmeta.SZ){
    return cb(new Error("Index out of bound"));
  }

  var slotStart = this.address + OATMETASIZE;
  var slotOffset = index*OBJHEADERSIZE;
  var slotAddr = slotStart + slotOffset;

  if(this.slotbuffer){
    var buff = this.slotbuffer.slice(slotOffset,slotOffset+OBJHEADERSIZE);
    setImmediate(function (){
      cb(null,BSON.parse(buff));
    });
  }else{
    var readstart = (options.nobuffer)?slotAddr:slotStart;
    var readlen = (options.nobuffer)?OBJHEADERSIZE:(OBJHEADERSIZE * this.oatmeta.SZ);
    self.file.read(readstart, readlen, function(err, rdbuffer) {
      if(options.nobuffer){
        cb(err,BSON.parse(rdbuffer));
      }else{
        self.slotbuffer = rdbuffer;
        var slicebuff = self.slotbuffer.slice(slotOffset,slotOffset+OBJHEADERSIZE);
        cb(err,BSON.parse(slicebuff));
      }
    });

  }

}

Oat.prototype.getSize = function(){
  return OATMETASIZE + (this.oatmeta.SZ * OBJHEADERSIZE);
}
