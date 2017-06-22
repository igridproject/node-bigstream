var async = require('async');

var Root = require('./root');
var ObjectData = require('./objectdata');
var ObjId = require('./objid');
var Oat = require('./oat');

module.exports = Reader;
function Reader(fd,root){
  this.file = fd;
  this.root = root;
  this.rootData = root.getRoot();
  this.cursorIdx = 0;
  this.oat = null;
}

Reader.prototype.moveTo = function(idx){
  var rootData = this.rootData;
  if(idx>0 && idx <= rootData.SEQ){
    this.cursorIdx = idx-1;
    return true;
  }else{
    return false;
  }
}

Reader.prototype.next = function(cb){
  var self=this;

  this.readAt(++this.cursorIdx,function(err,obj){
    if(!err && obj){
      cb(null,obj)
    }else{
      cb(err,null);
    }
  });
}

Reader.prototype.nextObject = function(cb){
  var self=this;

  this.readAt(++this.cursorIdx,function(err,obj){
    if(!err && obj){
      //cb(null,{})
      obj.readObject(cb);
    }else{
      cb(err,null);
    }
  });
}

Reader.prototype.objectAt = function(seq,opt,cb){
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  this.readAt(seq,options,function(err,obj){
    if(!err && obj){
      obj.readObject(cb);
    }else{
      cb(err,null);
    }
  });
}

Reader.prototype.readAt = function(seq,opt,cb){
  var self = this;
  var options = {};
  if(typeof opt == 'function'){
    cb = opt;
  }else{
    options = opt || {};
  }

  var rootData = this.rootData;

  if(seq<=0 || seq > rootData.SEQ){
    return cb(new Error('unavailable'));
  }

  var oatNo = Math.ceil(seq / rootData.OATZ);
  var slotNo = (seq-1)%rootData.OATZ;


  async.waterfall([
      function(callback) {
          //load last oat
          if(self.oat == null){
            Oat.load(self.file,rootData.OATA,function(err,oat){
              self.oat = oat;
              if(oat){
                callback(null);
              }else{
                callback(new Error('Oat Error'));
              }
            });
          }else{
            callback(null);
          }
      },
      function(callback){
        //move to current oat
        if(self.oat.oatmeta.SEQ==oatNo){
          callback(null);
        }else{
          self.oat.oatAt(oatNo,function(err,oat){
            if(oat && oat.oatmeta.SEQ == oatNo){
              self.oat = oat;
              callback(null);
            }else{
              callback(new Error('Oat Error'));
            }
          });
        }
      },
      function(callback){
        //getSlot
        self.oat.readSlot(slotNo,{nobuffer:options.nobuffer},function(err,slot){
          callback(err,slot);
        });

      }
  ], function (err,slot) {
    var obj = ObjectData.createByHeader(self.file,slot);
    cb(err,obj);
  });

}

Reader.prototype.remain = function(){
  var rootData = this.root.getRoot();
  return rootData.SEQ - this.cursorIdx;
}

Reader.prototype.count = function(){
  var rootData = this.root.getRoot();
  return rootData.SEQ;
}
