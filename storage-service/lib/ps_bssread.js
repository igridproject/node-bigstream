//console.log(__dirname);
var ctx = require(__dirname + '/context');

var path = require('path');
var fs = require('fs');
var async = require('async');

var BinStream = ctx.getLib('lib/bss/binarystream_v1_1');
var ObjId = ctx.getLib('lib/bss/objid');
var BSData = ctx.getLib('lib/model/bsdata');

onmessage = function (ev) {
  var msg = ev.data;

  if(msg.cmd == 'read')
  {
    bss_read_objects(msg.prm)
  }
};

function bss_read_objects (prm)
{
  var bss_full_path = prm.bss_full_path;
  var tail_no = prm.tail_no;
  var from_seq = prm.from_seq;
  var limit = prm.limit;
  var output_type = prm.output_type;
  var objOpt = prm.objOpt;
  var sizelimit = prm.sizelimit;

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
        var resultIdx=0;
        var counter=0;

        bss_start();
        async.whilst(
            function() { return cont; },
            function(callback){
              rd.nextObject(function(err,obj){
                if(idx > rec_count || !obj){
                  cont=false;
                }else{
                  idx++;
                  var dataout = JSON.stringify(obj_out(obj,objOpt));
                  //if(resultIdx>0){stream_newrec(respHelper,output_type);}
                  bss_output(dataout);
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
              //stream_end(respHelper,output_type);
              bss_end(200);
              bss.close(function(err){
                //res.status(200).end();
                //bss_end(200);
              });
            });

      });

    }else{
      bss_end(404);
    }

  });

}

function bss_start(data)
{
  //console.log('start');
  var msg = {
    'on' : 'start',
    'data' : data
  }
  postMessage(msg);
}

function bss_output(data)
{
  //console.log('data');
  var msg = {
    'on' : 'data',
    'data' : data
  }
  postMessage(msg);
}

function bss_end(code)
{
  //console.log('end');
  var msg = {
    'on' : 'end',
    'code' : code
  }
  postMessage(msg);
}


function obj_out(obj,opt){
  var ret = {}

  if(opt.id){ret._id = (new ObjId(obj.header.ID)).toString()}
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

  if(opt.field=='_id'){
    ret = ret._id;
  }else if(opt.field=='_meta'){
    ret = ret.meta;
  }else if(opt.field=='_data'){
    ret = ret.data;
  }

  return ret
}
