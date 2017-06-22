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
var BSData = ctx.getLib('lib/model/bsdata');

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
    var sizelimit = 64 * 1000 * 1000;

    //compat with v1
    // param => offset
    // param => obj_after
    if(query.offset){query.obj_after=query.offset;}
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

    // param => limit
    if(query.limit){
      limit = Number(query.limit);
    }

    // param => sizelimit
    if(query.sizelimit){
      sizelimit = Number(query.sizelimit) * 1000 * 1000;
    }

    // param => output = [object],stream
    var output_type = (query.output)?query.output:'object';

    //compat with v1
    // param => from
    // param => seq_from
    if(query.from){query.seq_from = query.from;}
    if(query.seq_from){
      from_seq = Number(query.seq_from);
    }

    // param => field = id,meta,[data]
    var objOpt = {'meta':true,'data':true}
    if(query.field == 'id'){
      objOpt.meta = false;
      objOpt.data = false;
    }else if(query.field == 'meta'){
      objOpt.data = false;
    }

    // param => last
    var tail_no = query.last;

    fs.exists(bss_full_path,function(exists){

      if(exists){

        BinStream.open(bss_full_path,function(err,bss){
          var rd = bss.reader();
          var rec_count = rd.count();

          if(tail_no){
            var last_count=Number(tail_no);
            from_seq = (rec_count - last_count) + 1;
          }

          if(from_seq<1){from_seq=1;}

          var idx = from_seq;
          var obj_return = [];

          var cont = true;
          if(idx > rec_count){cont=false;}
          rd.moveTo(idx);

          //start stream response
          stream_start(respHelper,output_type);
          var resultIdx=0;
          var counter=0;
          async.whilst(
              function() { return cont; },
              function(callback){
                rd.nextObject(function(err,obj){
                  if(idx > rec_count || !obj){
                    cont=false;
                  }else{
                    idx++;
                    var dataout = JSON.stringify(obj_out(obj,objOpt));
                    if(resultIdx>0){stream_newrec(respHelper,output_type);}
                    res.write(dataout);
                    counter += dataout.length;
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
                stream_end(respHelper,output_type);
                bss.close(function(err){
                  res.status(200).end();
                });
              });

        });

      }else{
        respHelper.response404();
      }

    });

});

function stream_start(resp,type)
{
  if(type=='stream')
  {
    resp.type('text');
  }else{
    resp.type('application/json');
    resp.write('[');
  }
}

function stream_newrec(resp,type)
{
  if(type=='stream')
  {
    resp.write('\n');
  }else{
    resp.write(',');
  }
}

function stream_end(resp,type)
{
  if(type=='stream')
  {
    resp.write('');
  }else{
    resp.write(']');
  }
}


function obj_out(obj,opt){
  var ret = {
              "_id" : (new ObjId(obj.header.ID)).toString()
            }

  if(opt.meta){ret.meta = obj.meta;}
  if(opt.data){
    if(obj.header.TY==BinStream.BINARY_TYPE)
    {
      var bs = BSData.create(obj.data);
      ret.data = bs.serialize('object-encoded');
    }else{
      ret.data = obj.data;
    }
  }

  return ret
}


module.exports = router;
