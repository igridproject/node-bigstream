
module.exports = ObjId;
function ObjId(prm){
    if (Buffer.isBuffer(prm)) {
        if (prm.length != 12){
          throw new Error("Buffer-based ObjectId must be 12 bytes")
        }
        this.bytes = prm
    }else if(typeof prm == 'object'){
      var fhn = (Buffer.isBuffer(prm.fhn) )?prm.fhn:new Buffer(4);
      var seq = prm.seq || 1;
      var ts = (prm.ts)?prm.ts:(Date.now() / 1000) & 0xFFFFFFFF;

      seq = seq & 0xFFFFFFFF;

      this.bytes = new Buffer([
            fhn[0],
            fhn[1],
            fhn[2],
            fhn[3],
            seq>>24,
            seq>>16,
            seq>>8,
            seq,
            ts>>24,
            ts>>16,
            ts>>8,
            ts
        ]);

    }else if (typeof prm == 'string') {
        if (prm.length != 24) throw new Error("String-based ObjectId must be 24 bytes")
        if (!/^[0-9a-f]{24}$/i.test(prm)) throw new Error("String-based ObjectId must in hex-format:" + prm)
        this.bytes = fromHex(prm)
    }
}

ObjId.prototype.extract = function(){
  var e_fhn = this.bytes.slice(0,4);
  var e_seq = this.bytes.readUInt32BE(4);
  var e_ts =  this.bytes.readUInt32BE(8);

  return {fhn:e_fhn,seq:e_seq,ts:e_ts};
}

ObjId.prototype.toString = function() {
    return toHex(this.bytes)
}

var toHex = function(buffer) {
    return buffer.toString('hex')
}

var fromHex = function(string) {
    return new Buffer(string, 'hex')
}
