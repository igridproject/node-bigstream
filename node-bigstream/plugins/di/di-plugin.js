var util = require('util');
var EventEmitter = require('events').EventEmitter;

function DIPlugin(context){
  EventEmitter.call(this);

  this.version = '0.1';
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
  this.output_type = '';
}

DIResponse.prototype.success = function(data,type){
  var self=this;
  var handle = this.handle;
  this.data = data;
  this.status = 'success';
  if(type){this.output_type=type;}
  process.nextTick(function(){
    handle.emit('done',{'status':'success','data':data,'type':self.output_type});
  });

}

DIResponse.prototype.error = function(err){
  var self=this;
  var handle = this.handle;
  this.data = err;
  this.status = 'error';
  process.nextTick(function(){
    handle.emit('done',{'status':'error','data':err});
  });
}

DIResponse.prototype.reject = function(){
  var handle = this.handle;
  this.status = 'reject';
  process.nextTick(function(){
    handle.emit('done',{'status':'reject'});
  });
}
