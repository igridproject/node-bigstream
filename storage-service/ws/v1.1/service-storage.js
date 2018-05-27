var ctx = require('../../../context');

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var async = require('async');
//var Worker = require("tiny-worker");

var cfg = ctx.config;
var storage_cfg = cfg.storage;
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var ObjId = ctx.getLib('lib/bss/objid');
var BSData = ctx.getLib('lib/model/bsdata');

var StorageUtils = ctx.getLib('storage-service/lib/storage-utils');

const AGENT_NAME = "Storage API";

router.put('/:id',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var q = reqHelper.getQuery();
    var sname = req.params.id;
    var json_body = req.body;
    var storagecaller = req.context.storagecaller;

    if(!json_body){
      return respHelper.response400();
    }

    if(!sname)
    {
      return respHelper.response400();
    }

    var databody = Array.isArray(json_body)?json_body:[json_body];
    var idx = 0;
    async.whilst(
        function() { return idx < databody.length; },
        function(callback) {
          //var el_data = databody[idx].data;
          var el_data = (BSData.parse(databody[idx].data)==null)?BSData.create(databody[idx].data).serialize('object-encoded'):databody[idx].data;
          var meta = databody[idx].meta;

          var dc_meta = {
            "_agent" : AGENT_NAME,
            "_ts" : Math.round((new Date).getTime() / 1000)
          }

          if(meta && typeof meta == 'object')
          {
            Object.keys(meta).forEach((item)=>{
              if(!item.startsWith('_')){
                dc_meta[item] = meta[item];
              }
            });
          }

          send_storage(storagecaller,dc_meta,el_data,sname,function(err){
            idx++;
            if(!err){
              callback(null);
            }else{
              callback(new Error('storage error'));
            }
          });
        },
        function (err) {
          if(!err){
            respHelper.response200();
          }else{
            respHelper.response400();
          }
        }
    );



});

function send_storage(caller,dc_meta,dc_data,storage_name,cb)
{
  var req = {
      'object_type' : 'storage_request',
      'command' : 'write',
      'param' : {
        'storage_name' : storage_name,
        'meta' : dc_meta,
        'data' : {
          'type' : 'bsdata',
          'value' : dc_data
        }
      }
    }

  caller.call(req,function(err,resp){
    if(!err && resp.status=='OK'){
      cb(null);
    }else{
      cb("error");
    }
  });

}

router.delete('/:id',function (req, res) {
  var reqHelper = request.create(req);
  var respHelper = response.create(res);
  var q = reqHelper.getQuery();
  var sname = req.params.id;
  var caller = req.context.storagecaller;

  var req = {
    'object_type' : 'storage_request',
    'command' : 'delete',
    'param' : {
      'storage_name' : sname
    }
  }

  caller.call(req,function(err,resp){
    if(!err && resp.status=='OK'){
      respHelper.response200();
    }else{
      respHelper.response400(resp.msg);
    }
  });


});

router.get('/',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);

    respHelper.responseOK(StorageUtils.list(storage_cfg.repository));

});

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

    var rd_prm = {
      'bss_full_path' : bss_full_path,
      'tail_no' : tail_no,
      'from_seq' : from_seq,
      'limit' : limit,
      'output_type' : output_type,
      'objOpt' : objOpt,
      'sizelimit' : sizelimit
    }

    var worker_pool = req.context.worker_pool;

    var worker = worker_pool.get();
    worker.resp = respHelper;
    worker.output_type = output_type;

    worker.execute({'cmd':'read','prm':rd_prm});

    worker.on('start',function(data){
      stream_start();
    });

    var firstline=true;
    worker.on('data',function(data){
      if(!firstline){
        stream_newrec();
      }else{firstline = false;}

      stream_data(data);
    });

    worker.on('end',function(code){
      if(code == '404')
      {
        end(404);
      }else if(code == '200'){
        stream_end();
        end(200);
      }
      worker.shutdown();
      //worker_pool.push(worker);
    });


    function stream_start()
    {
      var resp = worker.resp;
      var type = worker.output_type;
      if(type=='stream')
      {
        resp.type('text');
      }else{
        resp.type('application/json');
        resp.write('[');
      }
    }

    function stream_newrec()
    {
      var resp = worker.resp;
      var type = worker.output_type;
      if(type=='stream')
      {
        resp.write('\n');
      }else{
        resp.write(',');
      }
    }

    function stream_data(data)
    {
      var resp = worker.resp;
      resp.write(data);
    }

    function stream_end()
    {
      var resp = worker.resp;
      var type = worker.output_type;
      if(type=='stream')
      {
        resp.write('');
      }else{
        resp.write(']');
      }
    }

    function end(code)
    {
      var resp = worker.resp;
      if(code==404){
        resp.response404()
      }else{
        resp.status(code).end();
      }
    }

});




module.exports = router;
