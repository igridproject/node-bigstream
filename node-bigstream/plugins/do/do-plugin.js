var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DOPlugin(context,request){
  EventEmitter.call(this);

  this.version = '0.1';
  this.name = 'base';
  this.jobcontext = context;
  this.request = request;
}
util.inherits(DOPlugin, EventEmitter);

DOPlugin.prototype.getname = function(){
  return this.name;
}

DOPlugin.prototype.perform = function(){}

DOPlugin.prototype.run = function(){
  this.emit('start');
  var resp = new DOResponse(this);
  this.perform(this.jobcontext,this.request,resp);
}

module.exports = DOPlugin;


/*
  DOResponse
*/

function DOResponse(handle){
  this.handle = handle;
  this.status = null;
  this.data = null;

}

DOResponse.prototype.success = function(data){
  var handle = this.handle;
  this.status = 'success';
  this.data = data;
  process.nextTick(function(){
    handle.emit('done',{'status':'success','data':data});
  });

}

DOResponse.prototype.error = function(err){
  var handle = this.handle;
  this.status = 'error';
  this.data = err;
  process.nextTick(function(){
    handle.emit('done',{'status':'error','data':err});
  });
}

DOResponse.prototype.reject = function(){
  var handle = this.handle;
  this.status = 'reject';
  process.nextTick(function(){
    handle.emit('done',{'status':'reject','data':null});
  });
}
