var vm = require('vm');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_transform.param;
  var memstore = context.task.memstore

  var in_type = request.input_type;
  var in_data = request.data;
  var in_meta = request.meta;

  var mapscr = param.script || "";
  var datascr = param.text ;

  if(param.text){
    mapscr = mapscr + "; data=`" + param.text + "`";
  }

  var mapenv = {
    'src' : {
      'type' : in_type,
      'data' : in_data,
      'meta' : in_meta
    },
    'type' : in_type,
    'data' : in_data,
    'meta' : in_meta
  }

  var script = new vm.Script(mapscr);
  var context = new vm.createContext(mapenv);
  script.runInContext(context);

  var data = mapenv.data;
  var meta = mapenv.meta;
  var output_type = mapenv.type;
  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });

  response.success(data,{'meta':meta,'output_type':output_type});
  //response.reject();
  //response.error("error message")

}

module.exports = perform_function;
