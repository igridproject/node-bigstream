var ctx = require('../../context');
var cfg = ctx.config;

var amqp = require('amqplib/callback_api');


module.exports.newdata = function(prm,cb){
    var objId = prm.resourceId;
    var storageId = prm.storageId;
    var hostname = cfg.storage.api_hostname;
    var obj_api_url = hostname + '/v0.1/object'
    amqp.connect(cfg.amqp.url, function(err, conn) {
      if(err){
        console.log(err);
      }else{
        conn.createChannel(function(err, ch) {
            if(err){
                console.log(err);
            }else{
                var ex = 'bs_storage';
                var key = 'storage.' + storageId + '.dataevent.newdata';
                var objMsg = {
                    'event' : 'newdata',
                    'resourceId' : objId,
                    'resource_id' : objId,
                    'resource_location' : obj_api_url + '/' + storageId + '.' + objId
                }

                var msg = JSON.stringify(objMsg);

                ch.assertExchange(ex, 'topic', {durable: false});
                ch.publish(ex, key, new Buffer(msg));
                //console.log("[AMQP] Sent %s:'%s'", key, msg);
            }
        });
        setTimeout(function() { conn.close();}, 500);
       }
    });
}
