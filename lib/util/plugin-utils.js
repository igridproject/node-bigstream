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
