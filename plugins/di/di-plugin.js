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

DIPlugin.prototype.perform = function(){}

DIPlugin.prototype.run = function(){
  this.emit('start');
  var resp = new DIResponse(this);
  this.perform(this.jobcontext,resp);
}

module.exports = DIPlugin;


/*
  DIResponse
*/

function DIResponse(handle){
  this.handle = handle;
  this.status = null;
  this.data = null;
  this.meta = null;
  this.continue = false;
  this.output_type = '';
}

DIResponse.prototype.success = function(data,type){
  var self=this;
  var handle = this.handle;

  if(typeof type == 'string'){
    this.output_type=type;
  }else if(typeof type == 'object' && type){
    this.output_type=(type.output_type)?type.output_type:this.output_type;
    this.meta=(type.meta)?type.meta:this.meta;
    this.continue=(type.continue)?true:false;
  }

  this.data = (data)?data:this.data ;
  this.status = 'success';

  process.nextTick(function(){
    handle.emit('done', { 'status':'success',
                          'meta':self.meta,
                          'data':self.data,
                          'type':self.output_type,
                          'flag':{'continue':self.continue}
                        });
  });

}

DIResponse.prototype.error = function(err){
  var self=this;
  var handle = this.handle;
  this.data = err;
  this.status = 'error';
  process.nextTick(function(){
    handle.emit('done',{'status':'error',
                        'data':err
                      });
  });
}

DIResponse.prototype.reject = function(){
  var self=this;
  var handle = this.handle;
  this.status = 'reject';
  process.nextTick(function(){
    handle.emit('done',{ 'status':'reject',
                         'flag':{'continue':self.continue}
                      });
  });
}
