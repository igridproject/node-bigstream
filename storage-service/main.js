var ctx = require('../context');
var rpcserver = ctx.getLib('lib/amqp/rpcserver');
var Db = ctx.getLib('storage-service/lib/db');
var WorkerPool = ctx.getLib('storage-service/lib/worker_pool');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var cfg = ctx.config;
var storage_cfg = cfg.storage;

module.exports.create = function(cfg)
{
  var ss = new SS(cfg);
  return ss;
}

var SS = function StorageService(cfg)
{
    this.config = cfg;
    storage_cfg = cfg.storage;
    this.db = Db.create({'repos_dir':storage_cfg.repository});
    this.worker_pool = WorkerPool.create({'size':2});
}

SS.prototype.start = function()
{
  console.log('Starting Storage Service ...\n');
  this.amqp_start();
  this.http_start();
}

SS.prototype.amqp_start = function()
{
  var self = this;
  var amqp_cfg = this.config.amqp;

  if(this.amqp_server){return;}

  this.amqp_server = new rpcserver({
                url : amqp_cfg.url,
                name : 'storage_request'
              });
  this.amqp_server.set_remote_function(function(req,callback){

    self.db.request(req,function(err,res){
      if(err){
        console.log(err);
      }
      //console.log(res);
      callback(err,res);
    });

  });

  this.amqp_server.start(function(err){
    if(!err){
      console.log('SS:AMQP START\t\t\t[OK]');
    }else{
      console.log('SS:AMQP START\t\t\t[ERR]');
      console.log(err.message);
      process.exit(1);
    }
  });
}

SS.prototype.http_start = function()
{
  var self = this;
  var amqp_cfg = this.config.amqp;

  var API_PORT = (this.config.storage.api_port)?this.config.storage.api_port:19080;

  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  var context = ctx.getLib('lib/ws/http-context');
  this.worker_pool.initWorker();
  app.use(context.middleware({
    'worker_pool' : self.worker_pool
  }));

  app.use(require('./ws'));


  app.listen(API_PORT, function () {
    console.log('SS:DATA_API START\t\t[OK]');
  });


}
