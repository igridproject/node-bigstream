var util = require('util');
var EventEmitter = require('events');

function DIPlugin(){
  this.name = 'base';
}
util.inherits(DIPlugin, EventEmitter);

DIPlugin.prototype.getname = function(){
  return this.name;
}



module.exports = DIPlugin;
