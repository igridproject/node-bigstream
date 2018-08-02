var CONFIG_PATH = './conf/config';

module.exports.config = require(CONFIG_PATH);

module.exports.getLib = function(name){
    if(name)
    {
        return require('./' + name);
    }
    return null;
}

module.exports.getPlugins = function(type,name)
{
  var path = './plugins/' + type + '/' + type + '-' +name;

  return require(path);
}

module.exports.sysenv = {

}

module.exports.getServiceUrl = function(port,opt)
{
  return 'tcp://0.0.0.0:' + String(port);
}

module.exports.getClientUrl = function(port,opt)
{
  return 'tcp://127.0.0.1:' + String(port);
}

module.exports.getUnixSocketUrl = function(name){
  var sockname = name || 'test.sock';
  return 'unix://' + __dirname + '/tmp/' + sockname;
}
//module.exports.socket_dir = __dirname + '/tmp';
//module.exports.tmp_dir = __dirname + '/tmp';
