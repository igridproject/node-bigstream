var ctx = require('../../../context');

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var async = require('async');

var cfg = ctx.config;
var storage_cfg = cfg.storage;
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var ObjId = ctx.getLib('lib/bss/objid');

router.get('/:id/stats',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var sid = req.params.id;

    if(!sid){
      return respHelper.response404();
    }

    var storage_path = sid.split('.').join('/');
    var bss_full_path = storage_cfg.repository + "/" + storage_path + ".bss";

    fs.exists(bss_full_path,function(exists){

      if(exists){
        var fstat = stats = fs.statSync(bss_full_path);
        BinStream.open(bss_full_path,function(err,bss){
          var rd = bss.reader();
          var obj_stat = {
            "storagename" : sid,
            "count" : rd.count(),
            "filename" : storage_path + ".bss",
            "filesize" : fstat.size
          }
          bss.close(function(err){
            respHelper.responseOK(obj_stat);
          });
        });
      }else{
        respHelper.response404();
      }

    });

});

router.get('/:id/objects',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var sid = req.params.id;
    var query = reqHelper.getQuery();

    if(!query){query={};}

    if(!sid){
      return respHelper.response404();
    }

    var storage_path = sid.split('.').join('/');
    var bss_full_path = storage_cfg.repository + "/" + storage_path + ".bss";

    var from_seq = 1;
    var limit = 0;
    var sizelimit = 20 * 1000 * 1000;

    if(query.obj_after){
      var o_seq;
      try{
        var obj_id = new ObjId(query.obj_after);
        o_seq = obj_id.extract().seq;
      }catch(err){
        return respHelper.response404();
      }
      from_seq = o_seq+1;
    }

    if(query.limit){
      limit = Number(query.limit);
    }

    if(query.sizelimit){
      sizelimit = Number(query.sizelimit) * 1000 * 1000;
    }

    if(query.seq_from){
      from_seq = Number(query.seq_from);
    }

    var objOpt = {'meta':true,'data':true}
    if(query.show == 'id'){
      objOpt.meta = false;
      objOpt.data = false;
    }else if(query.show == 'meta'){
      objOpt.data = false;
    }

    fs.exists(bss_full_path,function(exists){

      if(exists){

        BinStream.open(bss_full_path,function(err,bss){
          var rd = bss.reader();
          var rec_count = rd.count();
          if(query.last){
            var last_count=Number(query.last);
            from_seq = (rec_count - last_count) + 1;
          }
          if(from_seq<1){from_seq=1;}

          var idx = from_seq;
          var obj_return = [];

          var cont = true;
          if(idx > rec_count){cont=false;}
          rd.moveTo(idx);

          //start stream response
          res.type('application/json');
          res.write('[');
          var resultIdx=0;
          var counter=0;
          async.whilst(
              function() { return cont; },
              function(callback){
                rd.nextObject(function(err,obj){
                  idx++;
                  if(!obj){
                    cont=false;
                  }else{
                    var dataout = JSON.stringify(obj_out(obj,objOpt));
                    if(resultIdx>0){res.write(',');}
                    res.write(dataout);
                    counter+=dataout.length;
                    if(sizelimit>0 && counter>=sizelimit){
                      cont=false;
                    }
                    if(limit>0 && idx>=from_seq+limit){
                      cont=false;
                    }
                    resultIdx++;
                  }
                  callback();
                });
              },function(err){
                res.write(']');
                bss.close(function(err){
                  res.status(200).end();
                  //respHelper.responseOK(obj_return);
                });
              });

        });

      }else{
        respHelper.response404();
      }

    });

});

function obj_out(obj,opt){
  var ret = {
              "_id" : (new ObjId(obj.header.ID)).toString()
            }

  if(opt.meta){ret.meta = obj.meta;}
  if(opt.data){ret.data = obj.data;}

  return ret
}


module.exports = router;
