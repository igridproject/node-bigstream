//di-window-event
function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param;
  var memstore = context.task.memstore

  var in_type = request.input_type;
  var in_data = request.data;
  var in_meta = request.meta;

  //parameter
  //prm_size :: int
  //prm_reject :: bool
  //prm_name :: text
  var prm_size = (param.size && Number(param.size)>0)?Number(param.size):1;
  var prm_reject = (param.reject==false)?false:true;
  var prm_name = (param.name)?'windw-'+param.name:'windw';

  var obj =  {
    'type' : in_type,
    'meta' : in_meta,
    'data' : in_data
  }
  var ret = [];
  memstore.getItem(prm_name,function(err,val){
    if(val && Array.isArray(val))
    {
      val.forEach(function(v){
        if(typeof v.data == 'object' && v.data.type == 'Buffer' && Array.isArray(v.data.data))
        {
          v.data = new Buffer(v.data.data);
        }
        ret.push(v);
      });
    }
    ret.push(obj);

    if(prm_reject && ret.length < prm_size)
    {
      memstore.setItem(prm_name,ret);
      response.reject();
    }else{
      ret = ret.slice(prm_size * -1);
      var meta = {'_size':ret.length};
      memstore.setItem(prm_name,ret);
      response.success(ret,{'meta':meta,'in_meta':in_type});
    }
  });



  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });

  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
