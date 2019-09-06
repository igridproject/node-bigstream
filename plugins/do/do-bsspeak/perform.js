var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');
var mqtt = require('mqtt')


var async = require('async');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param || {};
  var memstore = context.task.memstore;

  var in_type = request.type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta;

  var prm_url = param.url || "mqtt://127.0.0.1";
  var prm_topic = param.topic;

  var client  = mqtt.connect(prm_url);

  if(!prm_topic){
    prm_topic = "/bsspeak/job/" + job_id;
  }

  client.on('connect', function () {

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
        client.publish(topic,data[idx],function(err){
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
        client.end();
      }

    );

  });


  //response.success();
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
