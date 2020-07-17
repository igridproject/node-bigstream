var _dot = require('dot-prop');

var CONFIG_PATH = __dirname + '/conf/config';
var ENV_MAP = __dirname + '/env/index.js';

var cfg = require(CONFIG_PATH);

module.exports.config = cfg;

module.exports.getInfo = function (name)
{
  var BSINFO = {
    "v" : require('./version')
  }

  return BSINFO;
}

module.exports.getConfig = function(name,def,opt){
  var option = {};
  var def_val = def || '';
  var ret=def_val;

  if(typeof opt == 'object'){option=opt;}
  if(typeof option.env == 'undefined'){option.env=true;}
  if(typeof name != 'string' || name=='.'){name='';}

  var bs_cfg={};
  if(option.env){
    bs_cfg = envcnf(cfg);
  }else{
    bs_cfg = cfg;
  }

  if(typeof name != 'string' || name=='.' || name =='' || name == '*'){
    ret = bs_cfg;
  }else{
    ret = _dot.get(bs_cfg,name,def_val);
  }

  return ret;
}

var envcnf = function(init_obj){
  var obj=init_obj || {};
  var env = process.env;
  var envmap = require(ENV_MAP);

  if(!Array.isArray(envmap)){return obj;}
  envmap.forEach((em)=>{
    if(em.env && em.conf && env[em.env]){
      _dot.set(obj,em.conf,env[em.env]);
    }
  });

  return obj;
}
module.exports.getEnvConf = envcnf

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
