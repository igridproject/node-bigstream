var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DIPlugin(context){
  EventEmitter.call(this);

  this.name = 'base';
  this.jobcontext = context;
  this.outputdata = null;
}
util.inherits(DIPlugin, EventEmitter);

DIPlugin.prototype.getname = function(){
  return this.name;
}

DIPlugin.prototype.execute = function(){}

DIPlugin.prototype.run = function(){
  this.emit('start');
  var resp = new DIResponse(this);
  this.execute(this.jobcontext,resp);
}

module.exports = DIPlugin;


/*
  DIResponse
*/

function DIResponse(handle){
  this.handle = handle;
  this.status = null;
  this.data = null;
  this.output_type = '*';
}

DIResponse.prototype.success = function(data,type){
  var handle = this.handle;
  process.nextTick(function(){
    handle.emit('done',response('success',data,type));
  });

}

DIResponse.prototype.error = function(err){
  var handle = this.handle;
  process.nextTick(function(){
    handle.emit('done',response('error',err));
  });
}

DIResponse.prototype.reject = function(){
  var handle = this.handle;
  process.nextTick(function(){
    handle.emit('done',response('reject',null));
  });
}

function response(status,data,type){
  var resp = {'status':status,'data':data};
  if(type){
    resp.type = type;
    this.output_type = type;
  }else{
    resp.type = this.output_type;
  }


  this.data = data;
  this.status = status;
  return resp;
}
