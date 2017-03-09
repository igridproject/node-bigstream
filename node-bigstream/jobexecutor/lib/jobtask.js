var util = require('util');
var EventEmitter = require('events').EventEmitter;

function JobTask(prm)
{
  EventEmitter.call(this);

};
util.inherits(JobTask, EventEmitter);
//handle.emit('done',{'status':'error','data':err});
