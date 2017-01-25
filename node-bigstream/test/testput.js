var BinStream = require('../lib/bss/binarystream_v1_1');

var FNAME = "D:\\testfile\\testq.bss";

var initData = "kamron Aroonrua";
var initMeta = {"name":"kamron","age":31,"idx":0};

BinStream.open(FNAME,function(err,bss){

    //console.log(err);
    bss.write(initData,{meta:initMeta},function(err,obj){
      if(!err){
        console.log(obj.getHeader());
      }else {
        console.log(err);
      }
      bss.close(function(err){
        console.log('closed');
      });
    })

})
