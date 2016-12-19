var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DTPlugin(context,request){
  EventEmitter.call(this);

  this.version = '0.1';
  this.name = 'base';
  this.jobcontext = context;
  this.request = request;
  this.outputdata = null;
}
util.inherits(DTPlugin, EventEmitter);

DTPlugin.prototype.getname = function(){
  return this.name;
}

DTPlugin.prototype.perform = function(){}

DTPlugin.prototype.run = function(){
  this.emit('start');
  var resp = new DTResponse(this);
  this.perform(this.jobcontext,this.request,resp);
}

module.exports = DTPlugin;


/*
  DTResponse
*/

function DTResponse(handle){
  this.handle = handle;
  this.status = null;
  this.data = null;
  this.output_type = '';
}

DTResponse.prototype.success = function(data,type){
  var handle = this.handle;
  process.nextTick(function(){
    handle.emit('done',response('success',data,type));
  });

}

DTResponse.prototype.error = function(err){
  var handle = this.handle;
  process.nextTick(function(){
    handle.emit('done',response('error',err));
  });
}

DTResponse.prototype.reject = function(){
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
