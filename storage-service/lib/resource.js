

function resource(cfg)
{
  cfg = cfg || {};
  this.resource_store = cfg.resource_store;
}

resource.prototype.getData = function(res,cb)
{
  if(res.type == 'data')
  {
    cb(null,res.value);
  }else if(res.type == 'ref'){
    cb(null,"");
  }else{
    cb("unsupported datatype");
  }
}
