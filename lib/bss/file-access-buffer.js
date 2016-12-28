var randomAccessFile = require('random-access-file');
var fs = require("fs");
var async = require('async');
var BSON = require('buffalo');
var BUFFERSIZE = 1*1024*1024;

function FileAccessBuffer(filename,opt){
    if (!opt) opt = {};

    this.filename = filename;
    this.size = opt.size || BUFFERSIZE;
    this.buffer = null;
    this.file = randomAccessFile(this.filename,opt);

}

FileAccessBuffer.prototype.bufferedRead = function (offset, length, cb) {
    var self=this;
    var readStart = offset;
    var readEnd = (offset + length) - 1;
    var ret_buffer = new Buffer(length);

    if(!this.filesize){
      var stats = fs.statSync(this.filename);
      this.filesize = stats["size"];
    }

    if(this.buffer){
        var buffStart = this.buffer.offset;
        var buffEnd = (this.buffer.offset + this.buffer.data.length) - 1;

        if(readStart >= buffStart && readEnd <= buffEnd){
            this.buffer.data.copy(ret_buffer,0,readStart-buffStart,(readStart-buffStart)+length);
            setImmediate(function (){
                cb(null,ret_buffer);
               //cb(null,self.buffer.data.slice(readStart-buffStart,(readStart-buffStart)+length));
            });
        }else if(readStart >= buffStart && readStart <= buffEnd){
            //intersec back
            var bytesDiff = (buffEnd-readStart)+1;

            this.buffer.data.copy(ret_buffer,0,readStart-buffStart,(readStart-buffStart)+bytesDiff);

            var ioffset = buffEnd+1;
            var bytesRequire = length-bytesDiff;
            var ilength = (self.size>bytesRequire)?self.size:bytesRequire;

            if(ioffset+ilength > self.filesize){
                ilength = self.filesize - ioffset;
            }

            self.file.read(ioffset,ilength,function(err,buff){
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

    function newbuffer(callback){
        var loffset = offset;
        var llength = (self.size>length)?self.size:length;

        if(loffset+llength > self.filesize){
            llength = self.filesize - loffset;
        }

        self.file.read(loffset,llength,function(err,buff){
          //console.log('new read');
           if(!err){
            self.buffer = {
              "offset":loffset,
              "data":buff
            };
            buff.copy(ret_buffer,0,0,length);
           }
           callback(err,ret_buffer);
        });
    }

}

FileAccessBuffer.prototype.read = function (offset, length, cb) {
    //console.log('bypss read');
    this.file.read(offset, length, cb);
}

FileAccessBuffer.prototype.write = function (offset, buf, cb) {
    this.file.write(offset, buf, cb);
}

FileAccessBuffer.prototype.close = function (cb) {
    this.file.close(cb);
}

module.exports.create = function(filename,opt)
{
    return new FileAccessBuffer(filename,opt);
}
