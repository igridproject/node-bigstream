var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var bsdata = ctx.getLib('lib/model/bsdata');

var async = require('async');
var MicroGear = require('microgear');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;

  var in_type = request.type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta;

  var prm_appid = param.appid;
  var prm_appkey = param.appkey;
  var prm_secret = param.secret;
  var prm_topic = param.topic;

  var microgear = MicroGear.create({
    key : prm_appkey,
    secret : prm_secret
  });

  microgear.setCachePath('tmp/microgear-' + job_id + '.cache');
  //microgear.resetToken(function(result){
    microgear.connect(prm_appid);
  //});
  
  microgear.on('connected', function() {
    var idx = 0;
    async.whilst(
      function() { return idx < data.length; },
      function(callback) {
        var ev =  {
          'type' : in_type,
          'meta' : meta,
          'data' : data[idx]
        }
        var topic=Utils.vm_execute_text(ev,prm_topic);
        microgear.publish(topic, data[idx],{},function(err){
          idx++;
          callback(err);
        });
      },
      function (err) {
        if(!err){
          response.success();
        }else{
          console.log(err);
          response.error("publish error");
        }
        microgear.disconnect();
      }

    );

  });


  //response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
