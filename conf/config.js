var fs = require('fs');

var cfg = {
  'amqp' : cfg_load('amqp.json'),
  'mqtt' : cfg_load('mqtt.json'),
  'memstore' : cfg_load('memstore.json'),
  'storage' : cfg_load('storage.json'),
  'auth' : {
    'secret': cfg_load('secret.json'),
	  'acl' : cfg_load('acl.json')
  }
}

function cfg_load(fd)
{
  var ret = {};
  if(fs.existsSync(__dirname + '/' + fd)){
    ret = require(__dirname + '/' + fd);
  }else if(fs.existsSync(__dirname + '/template/' + fd)){
    ret = require(__dirname + '/template/' + fd);
  }

  return ret;
}

module.exports = cfg;