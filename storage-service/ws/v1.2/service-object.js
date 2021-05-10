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
var BSData = ctx.getLib('lib/model/bsdata');
var Tokenizer = ctx.getLib('lib/auth/tokenizer');

const ACL_SERVICE_NAME = "storage";

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
    opt.filetype = (query.file_type || query.filetype)?query.file_type || query.filetype:null;
    get_object(reqHelper,respHelper,{'oid':oid,'opt':opt});

});

router.get('/:id/file',function (req, res) {
  var reqHelper = request.create(req);
  var respHelper = response.create(res);
  var query = reqHelper.getQuery();
  var oid = req.params.id;

  var opt = {
    'field' : 'file'
  }
  opt.filetype = (query.file_type || query.filetype)?query.file_type || query.filetype:null;
  opt.filename = (query.file_name || query.filename)?query.file_name || query.filename:null;
  opt.download = (query.download)?true:null;

  get_object(reqHelper,respHelper,{'oid':oid,'opt':opt});

});

function oid_parse(oid,caller,cb)
{
  var ret = {'valid':true}
  if(!oid)
  {
    return cb(null,{'valid':false});
  }

  var storage_and_addr = oid.split('$');

  ret.storage_name = storage_and_addr[0];
  if(storage_and_addr.length == 1)
  {
    ret.by = "seq"
    ret.seq = -1;
    return cb(null,ret);
  }else if(storage_and_addr.length==2){
    var str_addr = storage_and_addr[1];
    if(str_addr.startsWith('{') && str_addr.endsWith('}')){
      ret.by = "key";
      ret.key = str_addr.substr(1,str_addr.length-2);
      if(ret.key.length<=0){
        return cb(null,{'valid':false});
      }
      var callreq = {
        'object_type' : 'storage_request',
        'command' : 'idxget',
        'param' : {
          'storage_name' : ret.storage_name,
          'key' : ret.key
        }
      }

      caller.call(callreq,function(err,resp){
        if(!err && resp.status=='OK' && resp.resp.found){
          ret.by = "obj";
          ret.obj_id = resp.resp.object_id;
          ret.seq = (new ObjId(ret.obj_id)).extract().seq;
          cb(null,ret);
        }else{
          cb(null,{'valid':false});
        }
      });

    }else if(str_addr.startsWith('[') && str_addr.endsWith(']')){
      ret.by = "seq";
      var str_num = str_addr.substr(1,str_addr.length-2);
      if(isNaN(str_num) || !Number.isInteger(Number(str_num))){
        ret.valid = false;
      }else{
        ret.seq = Number(str_num);
      }
      return cb(null,ret);
    }else{
      ret.by = "obj";
      ret.obj_id = storage_and_addr[1];

      try{
        var obj_id = new ObjId(ret.obj_id);
        ret.seq = obj_id.extract().seq;
      }catch(err){
        ret.valid=false;
      }
      return cb(null,ret);
    }
  }else{
    ret.valid=false;
    return cb(null,ret);
  }

}



function get_object(reqHelper,respHelper,prm)
{
  prm=prm||{};

  var oid = prm.oid;
  var opt = prm.opt || {};

  var storagecaller = reqHelper.request.context.storagecaller;
  var bsscache = reqHelper.request.context.bsscache;
  
  oid_parse(oid,storagecaller,(err,oid_result)=>{

    if(!oid_result.valid){
      respHelper.response404();
    }else{
      var acl_validator = reqHelper.request.context.acl_validator;
      var tInfo = Tokenizer.info(reqHelper.request.auth);
      var acp = acl_validator.isAccept(tInfo.acl,{
        "vo":tInfo.vo,"service":ACL_SERVICE_NAME,"resource":oid_result.storage_name,"mode":"r"
      });

      if(!acp){
        respHelper.response403();
      }else{

        var bss_full_path = storage_cfg.repository + "/" + oid_result.storage_name.split('.').join('/') + ".bss";
        
        fs.stat(bss_full_path,function(f_error,stats){

          if(!f_error && stats.isFile()){
            var cobj = null
            //cache
            if(oid_result.seq>=0){
              cobj = bsscache.getCache({
                s:oid_result.storage_name,
                t:'seq',
                k:String(oid_result.seq),
                v:stats.atimeMs
              })
            }

            if(cobj == null){
              //MISS Cache
              //console.log('Cache MISS----->>')
              BinStream.open(bss_full_path,function(err,bss){
                var rd = bss.reader();
                var rec_count = rd.count();
                var seq = (oid_result.seq>=0)?oid_result.seq:rec_count + oid_result.seq + 1;

                if(oid_result.seq<0){
                  cobj = bsscache.getCache({
                    s:oid_result.storage_name,
                    t:'seq',
                    k:String(seq),
                    v:stats.atimeMs
                  })
                }
        
                if(cobj == null){
                  rd.objectAt(seq,function(err,obj){
                    bss.close(function(err){
                      if(obj && (oid_result.by == 'seq' ||  oid_result.obj_id == (new ObjId(obj.header.ID)).toString()) ){
                          bsscache.setCache({
                            s:oid_result.storage_name,
                            t:'seq',
                            k:String(seq),
                            v:stats.atimeMs,
                            z:obj.header.MZ+obj.header.DZ
                          },obj)
                          output(respHelper,obj,opt);
                      }else{respHelper.response404();}
                    });
                  });
                }else{
                  //console.log('Cache HIT2----->>')
                  output(respHelper,cobj,opt);
                }

        
              });

            }else{
              //HIT Cache
              //console.log('Cache HIT----->>')
              output(respHelper,cobj,opt);
            }
            

          }else{
            respHelper.response404();
          }
      
        });

      }

    }

  });

}

function output(resp,obj,opt)
{
  if(opt.field=='data')
  {
    data_out(resp,obj,opt);
  }else if(opt.field=='file')
  {
    file_out(resp,obj,opt);
  }else{
    obj_out(resp,obj,opt);
  }
}

function obj_out(resp,obj,opt)
{
  var ret = {"_id" : (new ObjId(obj.header.ID)).toString(),
              "meta" : obj.meta
            }

  if(obj.header.TY==BinStream.BINARY_TYPE)
  {
    var bs = BSData.create(obj.data);
    ret.data = bs.serialize('object-encoded');
  }else{
    ret.data = obj.data;
  }
  resp.responseOK(ret);
}

function data_out(resp,obj,opt)
{
  var objType = obj.header.TY;

  if(objType == BinStream.BINARY_TYPE){
    if(opt.filetype){
      resp.response.type(opt.filetype);
    }else{

    }

    resp.response.send(obj.data);
  }else if(objType == BinStream.STRING_TYPE){
    resp.response.send(obj.data);
  }else{
    resp.responseOK(obj.data);
  }

}

function file_out(resp,obj,opt)
{
  var objType = obj.header.TY;
  var objId = (new ObjId(obj.header.ID)).toString();
  var meta = obj.meta || {};

  var defName=null;
  var defType=null;

  if(objType == BinStream.BINARY_TYPE){
    defType = "application/octet-stream";
    defName = (opt.filetype)?objId + "." + opt.filetype:objId + ".out";
  }else if(objType == BinStream.STRING_TYPE){
    defType = "text";
    defName = (opt.filetype)?objId + "." + opt.filetype:objId + ".out";
  }else{
    defType = "json";
    defName = (opt.filetype)?objId + "." + opt.filetype:objId + ".json";
  }

  var file_name = opt.filename || meta.file_name || defName;
  var file_type = opt.filetype || meta.file_type || defType;
  
  resp.response.type(file_type);
  if(opt.download){
    resp.response.set('Content-Disposition', 'attachment; filename="' + file_name + '"');
  }else{
    resp.response.set('Content-Disposition', 'filename="' + file_name + '"');
  }

  resp.response.send(obj.data);

}


module.exports = router;
