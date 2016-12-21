var randomAccessFile = require('random-access-file');
var async = require('async');
var BSON = require('buffalo');
var ObjectId = BSON.ObjectId;

var fileAccessBuffer = require('./file-access-buffer');

var VERSION = "0.1";
var ROOTSIZE = 256;
var HEADERSIZE = 80;

var STRING_TYPE = 1;
var BINARY_TYPE = 2;
var OBJECT_TYPE = 3;

module.exports.format = function(filename,cb){
    var bss = new Storage(filename,{"format":true});
    bss.close(cb);
};

module.exports.Storage = Storage;

function Storage(filename,opt)
{
    this.options = opt || {};
    this.filename = filename;
    
    var fOpt = this.options.format?{truncate: true} : null;
    //this.file = randomAccessFile(this.filename,fOpt);
    this.file = fileAccessBuffer.create(this.filename,fOpt);
    
    if(this.options.format){
        format(this.file,function(err){

        });
    }
    
    this.curIdx = 0;
    this.curAddr = 0;
}
 
Storage.prototype.write = function(data,options,cb){
    var self = this;
    options = options || {};
    
    //chk file root
    var headBuffer = null;
    var metaBuffer = null;
    var dataBuffer = null;

    var h = mkhead();
    
    
    async.waterfall(
        [
            function(callback) {
                readroot(self.file,function(err,root){
                    if(err || root==null){
                        callback("can not read root")
                    }else{
                        callback(null,root)
                    }
                });
            },
            function(root, callback) {
               //data
               switch (typeof data){
                   case 'string':
                       h.TY = STRING_TYPE;
                       h.DZ = Buffer.byteLength(data, 'utf8');
                       dataBuffer = new Buffer(data);
                       break;
                   default :
                       callback("invalid datatype");
               }

               callback();

            },
            function(callback) {
               //metadata
               if(options.meta){
                   metaBuffer = BSON.serialize(options.meta);
                   h.MZ = metaBuffer.length;

               }

               var recSize = HEADERSIZE + h.MZ + h.DZ;
               var recOffset = ROOTSIZE + GLOBAL_ROOT.RADDR;

               GLOBAL_ROOT.SEQ++;
               GLOBAL_ROOT.RADDR+=recSize;
               updateroot(self.file,function(){
                   callback(null,recSize,recOffset);
               });
            },
            function(recSize,recOffset,callback) {
               //objid
               h.ID = new ObjectId();

               //sequence no
               h.SQ = GLOBAL_ROOT.SEQ;

               //timestamp
               h.TS = new Date().getTime();

               headBuffer = BSON.serialize(h);

               var recBuffer = new Buffer(recSize);    
               headBuffer.copy(recBuffer);
               if(h.MZ>0){
                 metaBuffer.copy(recBuffer,HEADERSIZE);
               }
               dataBuffer.copy(recBuffer,HEADERSIZE+h.MZ);

               //write record
               self.file.write(recOffset,recBuffer,function(err){
                   callback()
               });
             
            }
        ],
        function (err) {
            cb(err);
        }
    );
    
    
    function p_process_record(){
        //chk file root
        var headBuffer = null;
        var metaBuffer = null;
        var dataBuffer = null;

        var h = mkhead();
        
        //data
        switch (typeof data){
            case 'string':
                h.TY = STRING_TYPE;
                h.DZ = Buffer.byteLength(data, 'utf8');
                dataBuffer = new Buffer(data);
                break;
            default :
                return cb("invalid datatype");
        }

        //metadata
        if(options.meta){
            metaBuffer = BSON.serialize(options.meta);
            h.MZ = metaBuffer.length;
            
        }

        var recSize = HEADERSIZE + h.MZ + h.DZ;
        var recOffset = ROOTSIZE + GLOBAL_ROOT.RADDR;

        GLOBAL_ROOT.SEQ++;
        GLOBAL_ROOT.RADDR+=recSize;
        updateroot(self.file,function(){});

        //objid
        h.ID = new ObjectId();

        //sequence no
        h.SQ = GLOBAL_ROOT.SEQ;

        //timestamp
        h.TS = new Date().getTime();

        headBuffer = BSON.serialize(h);

        var recBuffer = new Buffer(recSize);    
        headBuffer.copy(recBuffer);
        if(h.MZ>0){
          metaBuffer.copy(recBuffer,HEADERSIZE);
        }
        dataBuffer.copy(recBuffer,HEADERSIZE+h.MZ);

        //write record
        self.file.write(recOffset,recBuffer);
        cb();
    }
};

Storage.prototype.readNext = function(opt,cb){
    var self = this;
    opt = opt || {};
    
    
    async.waterfall(
        [
            function(callback) {
                readroot(self.file,function(err,root){
                    if(err || root==null){
                        callback("can not read root")
                    }else{
                        callback(null,self.curIdx < root.SEQ);
                    }
                });
            },
            function(havenext,callback) {
                if(havenext){
                    var fd = self.file;
                    var ofst = ROOTSIZE + self.curAddr;
                    
                    fd.read(ofst, HEADERSIZE, function(err, buffer) {
                        if(!err){ 
                            var head = BSON.parse(buffer);
                            //var head = {SQ:10000,MZ:40,DZ:15,TY:1};
                            self.curIdx++;
                            self.curAddr+= HEADERSIZE + head.MZ + head.DZ;
                            callback(null, head);
                        }else{
                            callback(err);
                        }
                    });
                    
                }else{
                    callback();
                }
            }
        ],
        function (err, obj) {
            var record = {"header":obj};
            if(!obj){
                record=null;
            }
            cb(err,record);
        }
    );
    
//    readroot(this.file,function(err,root){
//        if(err || root==null){
//            return cb("can not read root");
//        }else{
//            if(self.curIdx >= root.SEQ){
//                return cb();
//            }
//            p_read_record();
//        }
//    });
//    
//    function p_read_record(){
//        getRecord(self.fileBuffer,self.curAddr,function(err,rec){
//            self.curIdx++;
//            self.curAddr+= HEADERSIZE + rec.header.MZ + rec.header.DZ;
//            cb(err,rec);
//        });
//    }
    
};

Storage.prototype.close = function(cb){
    this.file.close(cb);
};

function format(fd,cb){
    var buffer = new Buffer(ROOTSIZE);
    BSON.serialize(mkroot(),buffer);
    fd.write(0,buffer,cb);
    cb();
}

function mkroot(prm)
{
    prm = prm || {};
    var r = {
        "VER":VERSION,
        "SEQ":0,
        "RADDR":0
    };
    
    
    if(prm.VER != null){
        r.VER = prm.VER;
    }
    
    if(prm.RCOUNT != null){
        r.SEQ = prm.RCOUNT;
    }
    
    if(prm.RADDR != null){
        r.RADDR = prm.RADDR;
    }
    
    return r;
}

var GLOBAL_ROOT = null;
function readroot(fd,cb)
{
    if(!GLOBAL_ROOT){
        fd.read(0, ROOTSIZE-1, function(err, buffer) {
            if(!err){
                GLOBAL_ROOT = BSON.parse(buffer);
            }
            cb(err,GLOBAL_ROOT);
        });
    }else{
        cb(null,GLOBAL_ROOT);
    }
}

function updateroot(fd,cb)
{
    if(GLOBAL_ROOT!==null){
        var buffer = new Buffer(ROOTSIZE);
        BSON.serialize(GLOBAL_ROOT,buffer);
        fd.write(0,buffer,cb);
    }
}

function mkhead(){
    return {
    "ID":null,
    "SQ":0,
    "TS":0,
    "TY":0,
    "FG":0,
    "MZ":0,
    "DZ":0
    };
}

function getRecord(fd,addr,cb){
    var offset = ROOTSIZE + addr;
 
    /*
 
    async.waterfall(
        [
            function(callback) {
                fd.read(offset, HEADERSIZE, function(err, buffer) {
                    if(!err){
                        var head = BSON.parse(buffer);
                        callback(null, head);
                    }else{
                        callback(err);
                    }
                });
            },
            function(head, callback) {
                var tailSize = head.MZ + head.DZ;
                var tailOffset = offset + HEADERSIZE;
                
                fd.read(tailOffset, tailSize, function(err, buffer) {
                    if(!err){
                        callback(null, head,buffer);
                    }else{
                        callback(err);
                    }
                });
            }
        ],
        function (err, headObj,tail) {
            var record = {"header":headObj};
            if(!err){
                
                if(headObj.MZ > 0 ){
                    var metaBuffer = new Buffer(headObj.MZ);
                    tail.copy(metaBuffer,0,0,headObj.MZ);
                    record.meta = BSON.parse(metaBuffer);
                }
                
                if(headObj.DZ > 0){
                    var dataBuffer = new Buffer(headObj.DZ);
                    tail.copy(dataBuffer,0,headObj.MZ,headObj.MZ+headObj.DZ);
                    record.data = dataBuffer.toString('utf8');
                }

                cb(null,record);
            }else{
                cb(err);
            }
        }
    );
    
    
    */
    
        async.waterfall(
        [
            function(callback) {
                fd.read(offset, HEADERSIZE, function(err, buffer) {
                    if(!err){
                        var head = BSON.parse(buffer);
                        callback(null, head);
                    }else{
                        callback(err);
                    }
                });
            }
        ],
        function (err, headObj) {
            var record = {"header":headObj};
            if(!err){

                cb(null,record);
            }else{
                cb(err);
            }
        }
    );
    
}