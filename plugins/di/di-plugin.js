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
}

DIResponse.prototype.success = function(data){
  this.handle.emit('done',response('success',data));
}

DIResponse.prototype.error = function(err){
  this.handle.emit('done',response('error',err));
}

DIResponse.prototype.reject = function(){
  this.handle.emit('done',response('reject',null));
}

function response(status,data){
  return {'status':status,'data':data}
}
