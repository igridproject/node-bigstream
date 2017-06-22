var ReaderWorker = require('./reader_worker');

module.exports.create = function(opt)
{
  return new WorkerPool(opt);
}

function WorkerPool (opt)
{
  opt = opt || {};
  this.pool = [];
  this.size = opt.size || 1;
}

WorkerPool.prototype.initWorker = function ()
{
  var pz = this.pool.length;

  for(var i=0;i<this.size-pz;i++)
  {
    var w = new ReaderWorker();
    this.pool.push(w);
  }
}

WorkerPool.prototype.get = function ()
{
  var w;
  if(this.pool.length > 0)
  {
    //console.log('worker get');
    w = this.pool.shift();
  }else{
    //console.log('worker new');
    w =  new ReaderWorker();
  }
  this.initWorker();
  return w;
}

WorkerPool.prototype.push = function (worker)
{
  worker.resp = null;
  worker.output_type = null;
  if(this.pool.length >= this.size)
  {
    //console.log('shutdown');
    worker.shutdown();
  }else{
    //console.log('worker back');
    this.pool.push(worker);
  }
}
