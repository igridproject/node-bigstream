var ctx = require('../context');
var async = require('async');

var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');

var FNAME = "D:/testfile/agritronics.bss";


// BinStream.open(FNAME,function(err,bss){
//
//   var rd = bss.reader();
//   var cont = true;
//   var idx=0;
//   async.whilst(
//       function() { return cont; },
//       function(callback) {
//
//         rd.nextObject(function(err,obj){
//           if(!obj){
//             cont=false;
//           }else{
//             idx++;
//             if(idx%100000 == 0){
//               console.log(idx);
//             }
//             //meta = obj.meta;
//             //console.log(obj.data);
//           }
//           callback();
//         });
//
//       },function(err){
//         bss.close(function(err){
//           console.log('close');
//         });
//       });
//
// });


BinStream.open(FNAME,function(err,bss){

  var rd = bss.reader();
  var cont = true;
  var idx=0;
  var tA = (new Date()).getTime();

  async.whilst(
      function() { return cont; },
      function(callback) {

        rd.next(function(err,obj){
          if(!obj){
            cont=false;
            callback();
          }else{
            obj.readMeta(function(err,obj){
              idx++;
              if(idx%10000 == 0){
                console.log(obj);
              }
              if(idx==86639){
                console.log(obj);
              }
              callback();
            });
            //meta = obj.meta;
            //console.log(obj.data);
          }
          //callback();
        });

      },function(err){
        bss.close(function(err){
          var tB = (new Date()).getTime();
          console.log(tB-tA);
          console.log('close');
        });
      });

});
