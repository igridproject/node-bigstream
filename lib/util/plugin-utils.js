var vm = require('vm');

module.exports.parse_script_param = function(param)
{
  if(!param)
  {
    return "";
  }else{
    var scrp = (Array.isArray(param))?param.join(';'):param;
    return scrp;
  }
}

module.exports.vm_execute_text = function(env,param)
{
  if(!param){return null}

  var sandbox = env;
  sandbox.vm_text_parameter = null;
  var script = new vm.Script("vm_text_parameter=`" + param + "`");
  var context = new vm.createContext(sandbox);
  script.runInContext(context);
  return sandbox.vm_text_parameter;
}
