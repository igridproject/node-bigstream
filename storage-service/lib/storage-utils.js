var path = require('path');
var fs = require('fs');

var bss_walk_sync = function(dir, filelist,cat) {
    files = fs.readdirSync(dir);
    filelist = filelist || [];
    cat = cat || '';
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
          var base_cat = cat + file + '.'
          filelist = bss_walk_sync(path.join(dir, file), filelist,base_cat);
        }
        else {
          if(path.extname(file) == '.bss'){
            var storage = cat + path.basename(file,'.bss');
            filelist.push(storage);
          }
        }
    });
    return filelist;
};

function name2path(name){
  return name.split('.').join('/');
}


module.exports.list = function (repo)
{
  return bss_walk_sync(repo)
}

/*
module.exports.mkBssId = function(repo,name,opt)
{

  var prefix_dir = repo + '/' + name.split('.').slice(0,-1).join('/');
  var dirlist = fs.readdirSync(dir);
  var found_storage = [];
  dirlist.forEach((file)=>{

  });
}
*/