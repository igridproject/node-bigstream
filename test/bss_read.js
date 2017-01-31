var ctx = require('../context');
var async = require('async');

var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');

var FNAME = "D:/testfile/gcs/file/test.bss";


BinStream.open(FNAME,function(err,bss){

  var rd = bss.reader();
  var cont = true;

  async.whilst(
      function() { return cont; },
      function(callback) {

        rd.nextObject(function(err,obj){
          if(!obj){
            cont=false;
          }else{
            //meta = obj.meta;
            console.log(obj.data);
          }
          callback();
        });

      },function(err){
        bss.close(function(err){
          console.log('close');
        });
      });

});
