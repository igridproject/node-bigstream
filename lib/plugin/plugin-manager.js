var async = require('async');

var path = require('path');
var fs = require('fs')

const PLUGINS_DIR = __dirname + '/../../plugins';

module.exports.create = function ()
{
    return new PluginManager();
}

function PluginManager()
{

}

PluginManager.prototype.list = function (type,opt)
{
  var result = [];
  if(['di','dt','do'].indexOf(type) < 0 ){return result;}

  var ns_all = [''].concat(list_ns(type));
  ns_all.forEach((ns)=>{
    result = result.concat(list_plugin_ns(type,ns));
  });

  return result;

}

PluginManager.prototype.npm_install_all = function (cb)
{
  var self=this;
  var di_list = this.list('di');
  var dt_list = this.list('dt');
  var do_list = this.list('do');

  console.log('PM :: installing bigstream plugin...');
  npm_all(di_list,()=>{
    npm_all(dt_list,()=>{
      npm_all(do_list,()=>{
        console.log('PM :: Finish');
        if(typeof cb == 'function'){cb()}
      });
    });
  });

  function npm_all(list,callback)
  {
    async.eachSeries(list,function (plugin,callb){
      self.npm_install_plugin(plugin.type,plugin.name,function(){
        callb();
      });
    },function(err){
      callback(err);
    });
  }


}

const os = require('os');
var spawn = require('child_process').spawn;
PluginManager.prototype.npm_install_plugin = function (type,name,cb)
{
  var p_path = __dirname + '/../../';
  var p_type = type;
  var p_name = name;
  if(typeof type == 'object')
  {
    p_path = p_path + type.path;
    p_type = type.type;
    p_name = type.name;
    cb = name;
  }else{
    p_path = p_path + this.getPath(type,name);
  }

  if(typeof cb != 'function'){cb=function(){}}

  var pack = p_path + '/package.json';
  var cmd = 'npm';
  if (os.platform() === 'win32') {
    cmd = 'npm.cmd';
  }
  fs.access(pack,(err)=>{
    if(err){
      console.log('PM :: install plugin module ' + type + ':' + name + '\t\t[SKIP]');
      cb();
    }else{
      console.log('PM :: installing plugin ' + type + ':' + name);
      var npm = spawn(cmd,['install'],{'cwd':p_path});
      // npm.stdout.on('data', (data) => {
      //   console.log(`${data}`);
      // });

      npm.stderr.on('data', (data) => {
        console.log(`${data}`);
      });

      npm.on('close', (code) => {
        if(code){
          console.log('PM :: install plugin module ' + type + ':' + name + '\t\t[FAILED]');
        }else{
          console.log('PM :: install plugin module ' + type + ':' + name + '\t\t[OK]');
        }
        cb();
      });
    }
  });


}

PluginManager.prototype.getPath = function(type,name)
{
  var ns='';
  var n=name;
  var tok = name.split('.');
  if(tok.length>1){
    ns = tok[0] + '/';
    n = tok.slice(1).join('.');
  }

  return 'plugins/' + type + '/' + ns + type + '-' + n;
}

function list_ns (type)
{
    var result = [];
    var p_dir = path.join(PLUGINS_DIR,type);
    var files = fs.readdirSync(p_dir);
    files.forEach((item)=>{
      if(fs.statSync(path.join(p_dir, item)).isDirectory() && item.startsWith(type + '-')==false)
      {
        result.push(item);
      }
    });

    return result;
}

function list_plugin_ns (type,ns)
{
  var result = [];
  var p_dir = path.join(PLUGINS_DIR,type);
  if(ns && ns!='')
  {
    p_dir = path.join(p_dir,ns);
  }

  var files = fs.readdirSync(p_dir);
  files.forEach((item)=>{
    var pref = type + '-'
    if(fs.statSync(path.join(p_dir, item)).isDirectory() && item.startsWith(pref)){
      var nspath = (ns && ns!='')?ns+'/':'';
      var n = (ns && ns!='')?ns+'.'+item.substr(pref.length):item.substr(pref.length);
      var res = {
        'type':type,
        'name':n,
        'ns':(ns)?ns:'',
        'path': 'plugins/' + type + '/' + nspath  + item
      }
      result.push(res);
    }

  });
  return result;
}
