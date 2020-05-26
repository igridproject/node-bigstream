var Client = require("ssh2-sftp-client");
var path = require('path');

function perform_function(context,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_in.param;
  var memstore = context.job.memstore;
  var output_type = 'object'

  var prm_host = param.host;
  var prm_port = param.port || 22;
  var prm_user = param.username || "";
  var prm_pass = param.password || "";
  var prm_dir = param.dir || "~";
  var prm_encoding = param.encoding || "binary";
  var prm_continue = (typeof param.continue == 'boolean' && param.continue.toString() == 'false')?false:true;

  //filter.ext|filetype
  var prm_filter = param.filter || {};

  var meta = {};
  var last_mod = {'fname':'','tts':0};
  var fs_continue = false;
  var buff_out = new Buffer(0);

  if(param.last_modify_ts)
  {
    last_mod.tts = param.last_modify_ts*1000;
  }

  memstore.getItem('lastmodify',function(err,value){
    if(value && value.tts > last_mod.tts){
      last_mod=value;
    }
    getData();
  });

  function getData(){
    var sftp = new Client();
    sftp.connect({
        host: prm_host,
        port: prm_port,
        username: prm_user,
        password: prm_pass
    }).then(() => {
    	return sftp.list(prm_dir + '/');
    }).then((fList) => {

    	var f_target = null;
      var last_tts = 0;
      var sync_list = [];
    	fList.forEach((file)=>{
    		if(file.modifyTime > last_mod.tts  && file.type == '-' && rulesMatch(prm_filter,file)){
          sync_list.push(file);
          if(f_target==null || (file.modifyTime < f_target.modifyTime) ){
            f_target = file;
            last_tts = file.modifyTime;
            last_mod.fname = file.name;
          }
    		}
    	});
      if(sync_list.length > 1 && prm_continue){fs_continue = true;}
      last_mod.tts = last_tts;

    	if(f_target){
        meta = {
          'filename' : f_target.name,
          'fileext': path.extname(f_target.name),
          'filesize': f_target.size,
          'modify_ts' : Math.round(f_target.modifyTime/1000)
        }
    		return sftp.get(prm_dir + '/' + f_target.name);
    	}else{
    		return null;
    	}

    }).then((data) => {
    	if(data){
    
          var nb = Buffer.concat([buff_out,data]);
          buff_out = nb;
     
    		
          sftp.end()
          memstore.setItem('lastmodify',last_mod,function(err){
            var result=(prm_encoding=='binary')?buff_out:buff_out.toString('utf8');
            response.success(result, {"meta":meta,"continue": fs_continue});
          });
    
    	}else{
    		sftp.end();
    		response.reject();
    	}
    })
    
    /*.catch((err) => {
        sftp.end();
        response.error(err);
        console.log(err, 'catch error');
    });*/
  }




  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction2',function(err,value){
  //   console.log('key');
  //   console.log(value);
  //   response.success(value);
  // });

  //response.success(data,output_type);
  //response.reject();
  //response.error("error message")

}

function rulesMatch(r,fd)
{
  var ret = true;
  var fname = fd.name;

  if(r.ext){
    var extlist = (Array.isArray(r.ext))?r.ext:r.ext.split(',');
    if(extlist.indexOf(path.extname(fname)) < 0){
      ret = false;
    }
  }

  if(r.filetype){
    var ftlist = (Array.isArray(r.filetype))?r.filetype:r.filetype.split(',');
    if(ftlist.indexOf(path.extname(fname)) < 0){
      ret = false;
    }
  }




	return ret;
}

module.exports = perform_function;
