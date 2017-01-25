var BinStream = require('../lib/bss/binarystream_v1_0');
var async = require('async');

var FNAME = "D:\\testfile\\test-qq.bss";


var initData = {name:"kamron Aroonrua",ts:new Date(),name2:"kamron Aroonrua",name3:"kamron Aroonrua"};
var initMeta = {"name":"kamron","age":31,name2:"kamron Aroonrua",name3:"kamron Aroonrua","idx":1};

var idx = 0;
var imax = 300000;
var tStart = (new Date()).getTime();

BinStream.open(FNAME,function(err,bss){

    bss.write(initData,{meta:initMeta},onwrite);

    function onwrite(err){
        if(!err && idx<imax){
            idx++;
            //initMeta.idx++;
            bss.write(initData,{meta:initMeta},onwrite);
        }else{
            bss.close(function(err){
                var tTotal = (new Date()).getTime() - tStart ;
                console.log('ok put finish');
                console.log(tTotal);
            });
        }
    }

    // for(var i=0;i<(imax+1);i++){
    //   bss.write(initData,{meta:initMeta},function(err){
    //     if(err){
    //       console.log(err);
    //     }
    //   });
    // }
    // console.log('loop finish');
});
