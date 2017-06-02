var ctx = require('../../../context');

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');

var cfg = ctx.config;
var storage_cfg = cfg.storage
var response = ctx.getLib('lib/ws/response');
var request = ctx.getLib('lib/ws/request');
var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var ObjId = ctx.getLib('lib/bss/objid');

router.get('/:id',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var oid = req.params.id;

    var opt = {}
    get_object(reqHelper,respHelper,{'oid':oid,'opt':opt});

});

router.get('/:id/data',function (req, res) {
    var reqHelper = request.create(req);
    var respHelper = response.create(res);
    var query = reqHelper.getQuery();
    var oid = req.params.id;

    var opt = {
      'field' : 'data'
    }
    get_object(reqHelper,respHelper,{'oid':oid,'opt':opt});

});

function get_object(reqHelper,respHelper,prm)
{
  prm=prm||{};

  var oid = prm.oid;
  var opt = prm.opt || {};

  if(!oid){
    return respHelper.response404();
  }

  var bss_ab_path = "default.bss";
  var path_token= oid.split('.');

  if(path_token.length >= 2){
    var col = "";
    var file = path_token[path_token.length-2] + ".bss";
    var col = path_token.slice(0,path_token.length-2).join('/');

    if(col.length>0){col = col + '/'}

    bss_ab_path = col + file;
  }else{
    //Only Id no storage name
    //Default Action
  }

  var tkoId = path_token[path_token.length-1];
  var bss_full_path = storage_cfg.repository + "/" + bss_ab_path;
  var obj_id = '';

  try{
    obj_id = new ObjId(tkoId);
  }catch(err){
    return respHelper.response404();
  }

  var seq = obj_id.extract().seq;

  fs.exists(bss_full_path,function(exists){

    if(exists){
      BinStream.open(bss_full_path,function(err,bss){
        var rd = bss.reader();
        rd.objectAt(seq,function(err,obj){
          bss.close(function(err){
            if(obj && obj_id.toString() == (new ObjId(obj.header.ID)).toString()){
                output(respHelper,obj,opt);
            }else{respHelper.response404();}
          });
        });

      });
    }else{
      respHelper.response404();
    }

  });

}

function output(resp,obj,opt)
{
  obj_out(resp,obj,opt);
}

function obj_out(resp,obj,opt){
  var ret = {"_id" : (new ObjId(obj.header.ID)).toString(),
              "meta" : obj.meta,
              "data" : obj.data
            }
  resp.responseOK(ret);
}



module.exports = router;
