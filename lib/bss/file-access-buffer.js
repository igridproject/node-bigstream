var thunky = require('thunky');
var randomAccessFile = require('random-access-file');
var fs = require("fs");
var async = require('async');
var BSON = require('buffalo');
var BUFFERSIZE = 1*1024*1024;

function FileAccessBuffer(filename,opt){
    if (!opt) opt = {};

    var self = this;

    this.filename = filename;
    this.size = opt.size || BUFFERSIZE;
    this.buffer = null;
    this.file = new randomAccessFile(this.filename,opt);

    this.opened = false
}

FileAccessBuffer.prototype.open = function open (cb) {

  var self = this;
  fs.open(self.filename, 'r', onopen)

  function onopen (err, fd) {

    if (err) {
      return cb(err);
    }

    self.opened = true;
    self.fd = fd;

    fs.fstat(fd, function (err, st) {
      if (err) {
        return cb(err)
      }
      self.filesize = st.size;
      cb();
    });
  }
}

FileAccessBuffer.prototype.bufferedRead = function (offset, length, cb) {
    var self=this;
    var readStart = offset;
    var readEnd = (offset + length) - 1;
    var ret_buffer = new Buffer(length);

    if(!self.filesize){
      fs.stat(self.filename,function(err,stats){
        self.filesize = stats["size"];
        do_read();
      });
    }else{
      do_read();
    }

    function do_read(){

      if(self.buffer){
          var buffStart = self.buffer.offset;
          var buffEnd = (self.buffer.offset + self.buffer.data.length) - 1;

          if(readStart >= buffStart && readEnd <= buffEnd){
              self.buffer.data.copy(ret_buffer,0,readStart-buffStart,(readStart-buffStart)+length);
              setImmediate(function (){
                  cb(null,ret_buffer);
                 //cb(null,self.buffer.data.slice(readStart-buffStart,(readStart-buffStart)+length));
              });
          }else if(readStart >= buffStart && readStart <= buffEnd){
              //intersec back
              var bytesDiff = (buffEnd-readStart)+1;

              self.buffer.data.copy(ret_buffer,0,readStart-buffStart,(readStart-buffStart)+bytesDiff);

              var ioffset = buffEnd+1;
              var bytesRequire = length-bytesDiff;
              var ilength = (self.size>bytesRequire)?self.size:bytesRequire;

              if(ioffset+ilength > self.filesize){
                  ilength = self.filesize - ioffset;
              }

              self.read(ioffset,ilength,function(err,buff){
                //console.log('intersec read');
                 if(!err){
                  self.buffer = {
                    "offset":ioffset,
                    "data":buff
                  };
                  buff.copy(ret_buffer,bytesDiff,0,bytesRequire);
                 }
                 cb(err,ret_buffer);
              });

          }else{
              newbuffer(cb);
          }
      }else{
          newbuffer(cb);
      }

    }

    function newbuffer(callback){
        var loffset = offset;
        var llength = (self.size>length)?self.size:length;

        if(loffset+llength > self.filesize){
            llength = self.filesize - loffset;
        }

        self.read(loffset,llength,function(err,buff){
          //console.log('new read');
           if(!err){
            self.buffer = {
              "offset":loffset,
              "data":buff
            };
            //try{buff.copy(ret_buffer,0,0,llength);}catch(e){process.exit(1)}
            buff.copy(ret_buffer,0,0,llength);
           }
           callback(err,ret_buffer);
        });
    }

}

FileAccessBuffer.prototype.read = function (offset, length, cb) {
    //console.log('bypss read ');
    this.file.read(offset, length, cb);
    // var self=this;
    // if(!self.fd){return cb(new Error('File not opened'));}
    //
    // var buf = new Buffer(length)
    // var len = 0;
    // var bufOfs = 0;
    // var readlen = length;
    // var fileOfs = offset;
    // async.whilst(
    //     function() { return len < length },
    //     function(callback) {
    //       //console.log(self.filename + ' ' + String(len) + ' ' + String(readlen) + ' ' + String(fileOfs));
    //       fs.read(self.fd, buf, len, readlen, fileOfs, function(err,bytes){
    //         len+=bytes;
    //         fileOfs+=bytes;
    //         readlen-=bytes;
    //         callback(err);
    //       });
    //     },function(err){
    //       if(err){console.log(err);}
    //       cb(err,buf);
    //     }
    // );

}

FileAccessBuffer.prototype.write = function (offset, buf, cb) {
    this.file.write(offset, buf, cb);
}

FileAccessBuffer.prototype.close = function (cb) {
    this.file.close(cb);
}

module.exports.create = function(filename,opt)
{
    var inst = new FileAccessBuffer(filename,opt);
    return inst;
}
