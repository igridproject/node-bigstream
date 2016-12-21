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
