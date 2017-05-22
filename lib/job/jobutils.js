
function validate (jobcfg)
{
  var ret = true;

  if(!jobcfg){ return false;}
  if(!jobcfg.job_id){return false;}
  if(!validate_trigger(jobcfg.trigger)){return false;}

  return ret;
}

function validate_trigger (trigger)
{
  if(!trigger){return true;}
  if(!trigger.type){return false;}

  return true;
}

module.exports.validate = validate;
