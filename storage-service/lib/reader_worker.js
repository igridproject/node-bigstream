var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Worker = require("tiny-worker");

module.exports = ReaderWorker;
function ReaderWorker ()
{
  EventEmitter.call(this);

  var self=this;

  this.resp = null;
  this.output_type = '';
  this.firstline=true;

  this.w = new Worker("storage-service/lib/ps_bssread.js");
  this.w.onmessage = function (ev) {
    var msg = ev.data;
    var code = msg.code;

    if(msg.on == 'end'){
      // if(code == '404')
      // {
      //   end(404);
      // }else if(code == '200'){
      //   stream_end();
      //   end(200);
      // }
      self.emit('end',msg.code);
    }
    if(msg.on == 'start'){
      // stream_start();
      self.emit('start',msg.data);
    }
    if(msg.on == 'data'){
      // if(!self.firstline){
      //   stream_newrec();
      // }else{self.firstline = false;}
      // stream_data(msg.data);
      self.emit('data',msg.data);
    }
  }

  // function stream_start()
  // {
  //   var resp = self.resp;
  //   var type = self.output_type;
  //   if(type=='stream')
  //   {
  //     resp.type('text');
  //   }else{
  //     resp.type('application/json');
  //     resp.write('[');
  //   }
  // }
  //
  // function stream_newrec()
  // {
  //   var resp = self.resp;
  //   var type = self.output_type;
  //   if(type=='stream')
  //   {
  //     resp.write('\n');
  //   }else{
  //     resp.write(',');
  //   }
  // }
  //
  // function stream_data(data)
  // {
  //   var resp = self.resp;
  //   resp.write(data);
  // }
  //
  // function stream_end()
  // {
  //   var resp = self.resp;
  //   var type = self.output_type;
  //   if(type=='stream')
  //   {
  //     resp.write('');
  //   }else{
  //     resp.write(']');
  //   }
  // }
  //
  // function end(code)
  // {
  //   var resp = self.resp;
  //   if(code==404){
  //     resp.response404()
  //   }else{
  //     resp.status(code).end();
  //   }
  // }

}
util.inherits(ReaderWorker, EventEmitter);

ReaderWorker.prototype.execute = function (msg)
{
  this.working = true;
  this.w.postMessage(msg);
}

ReaderWorker.prototype.shutdown = function ()
{
  this.w.terminate();
}
