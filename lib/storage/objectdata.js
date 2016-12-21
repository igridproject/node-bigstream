var BSON = require('buffalo');
var bsonp = require('bson')
var BSONP = new bsonp.BSONPure.BSON()

const OBJHEADERSIZE = 80;

const STRING_TYPE = 1;
const BINARY_TYPE = 2;
const OBJECT_TYPE = 3;

//Header structure
var header_struct = function(){
  return {
    "ID" : null,
    "TY" : 1,
    "FG" : null,
    "MZ" : 0,
    "DZ" : 0,
    "AD" : 0
  }
}


function ObjectData(fd,header,meta,data){
  this.file = fd;
  this.header = header;

  //Buffer
  this.metaBuffer = meta;
  this.dataBuffer = data;
}

ObjectData.prototype.getHeader = function(){
  return this.header;
}

ObjectData.prototype.getObjectSize = function(){
  return this.header.MZ + this.header.DZ;
}

ObjectData.prototype.setAddress = function(addr){
  return this.header.AD = addr;
}

ObjectData.prototype.readMeta = function(opt,cb){
  self=this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var fd=this.file;
  var oStart = this.header.AD;
  var oLen = this.header.MZ;

  fd.bufferedRead(oStart,oLen,function(err,buff){
    if(!err){
      cb(null,BSON.parse(buff));
    }else{
      cb(err);
    }
  });

}

ObjectData.prototype.readData = function(opt,cb){
  var self=this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var fd=this.file;
  var oStart = this.header.AD + this.header.MZ;
  var oLen = this.header.DZ;

  fd.bufferedRead(oStart,oLen,function(err,buff){
    if(!err){
      cb(null,parse_data(buff,self.header.TY));
    }else{
      cb(err);
    }
  });
}

ObjectData.prototype.readObject = function(opt,cb){
  var self=this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var fd=this.file;
  var oStart = this.header.AD;
  var oLen = this.header.MZ + this.header.DZ;

  fd.bufferedRead(oStart,oLen,function(err,buff){
    if(!err){
      var obj = {
        header : self.header,
        meta : BSON.parse(buff.slice(0,self.header.MZ)),
        data : parse_data(buff.slice(self.header.MZ,self.header.MZ+self.header.DZ),self.header.TY),
      }

      cb(null,obj);
    }else{
      cb(err);
    }
  });

}

var parse_data = function(buffer,ty){
  if(ty==STRING_TYPE){
    return buffer.toString('utf8');
  }else if(ty==OBJECT_TYPE){
    return BSON.parse(buffer);
  }else{
    return buffer;
  }
}

ObjectData.prototype.write = function(addr,cb){
  var address = this.header.AD;

  if(typeof addr == 'function'){
    cb = addr;
  }else if(Number(addr)>0){
    address = addr;
    this.header.AD = address;
  }
  var fd=this.file;

  var objBuffer = new Buffer(this.header.MZ + this.header.DZ)
  if(this.header.MZ>0){
    this.metaBuffer.copy(objBuffer);
  }
  this.dataBuffer.copy(objBuffer,this.header.MZ)

  fd.write(this.header.AD,objBuffer,function(err){
    cb(err);
  })
}

module.exports.HEADERSIZE = OBJHEADERSIZE;

module.exports.createByHeader = function(fd,header){
  return new ObjectData(fd,header,null,null);
}

module.exports.createByData = function(fd,prm){
  var id = prm.id;
  var data = prm.data;
  var meta = prm.meta;
  var address = (prm.address)?prm.address:0;

  var header = header_struct();
  var metaBuffer = null;
  var dataBuffer = null;

  //data
  switch (typeof data){
      case 'string':
          header.TY = STRING_TYPE;
          header.DZ = Buffer.byteLength(data, 'utf8');
          dataBuffer = new Buffer(data);
          break;
      case 'object':
          if(data instanceof Buffer){
            header.TY = BINARY_TYPE;
            header.DZ = data.length;
            dataBuffer = data;
          }else{
            var objData = BSON.serialize(data);
            header.TY = OBJECT_TYPE;
            header.DZ = objData.length
            dataBuffer = objData;
          }
          break;
      default :
          return null;
  }

  if(meta){
    metaBuffer = BSON.serialize(meta);
    header.MZ = metaBuffer.length;
  }

  header.ID = id;
  header.AD = address
  return new ObjectData(fd,header,metaBuffer,dataBuffer);
}
