var ctx = require('../context');
var ConnCtx = ctx.getLib('lib/conn/connection-context');
var rpcserver = ctx.getLib('lib/amqp/rpcserver');
var SSServer = ctx.getLib('lib/axon/rpcserver');
var Db = ctx.getLib('storage-service/lib/db');
var WorkerPool = ctx.getLib('storage-service/lib/worker_pool');
var SSCaller = ctx.getLib('lib/axon/rpccaller');

var Tokenizer = ctx.getLib('lib/auth/tokenizer');
var ACLValidator = ctx.getLib('lib/auth/acl-validator');

var jwt = require('express-jwt');
var express = require('express');

var app = express();
var bodyParser = require('body-parser');

var EventPub = ctx.getLib('lib/amqp/event-pub');
var cfg = ctx.config;

var SS_LISTEN = ctx.getUnixSocketUrl('ss.sock');
var SS_URL = ctx.getUnixSocketUrl('ss.sock');
// var SS_LISTEN = ctx.getServiceUrl(19030);
// var SS_URL = ctx.getClientUrl(19030);

module.exports.create = function(cfg)
{
  var ss = new SS(cfg);
  return ss;
}

var SS = function StorageService(p_cfg)
{
    this.config = p_cfg;
    var storage_cfg = p_cfg.storage;
    var amqp_cfg = p_cfg.amqp;

    this.context = {
      'cfg':p_cfg,
      'evp':new EventPub({'url':amqp_cfg.url,'name':'bs_storage'})
    }

    this.conn = ConnCtx.create(this.config);
    this.mem = this.conn.getMemstore();

    this.db = Db.create({'redis':this.mem,'repos_dir':storage_cfg.repository,'context':this.context});
    this.worker_pool = WorkerPool.create({'size':2});
    //this.storagecaller = new SSCaller({'url':SS_URL});
}

SS.prototype.start = function()
{
  console.log('Starting Storage Service ...\n');
  this.amqp_start();
  this.ipc_start();
  setTimeout(function(){
    this.http_start();
  },5000);
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
      console.log('SS:AMQP ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }
  });
}

SS.prototype.ipc_start = function()
{
  var self = this;

  if(this.ipc_server){return;}

  this.ipc_server = new SSServer({
                url : SS_LISTEN,
                name : 'storage_request'
              });
  this.ipc_server.set_remote_function(function(req,callback){
    //console.log("IPC Command");
    self.db.request(req,function(err,res){
      if(err){
        console.log(err);
      }
      callback(err,res);
    });

  });

  this.ipc_server.start(function(err){
    if(!err){
      console.log('SS:IPC START\t\t\t[OK]');
    }else{
      console.log('SS:IPC START\t\t\t[ERR]');
      console.log('SS:IPC ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }
  });
}

SS.prototype.http_start = function()
{
  var self = this;
  var amqp_cfg = this.config.amqp;
  var auth_cfg = this.config.auth;

  var API_PORT = (this.config.storage.api_port)?this.config.storage.api_port:19080;

  app.use(bodyParser.json({limit: '64mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  var context = ctx.getLib('lib/ws/http-context');
  this.storagecaller = new SSCaller({'url':SS_URL});
  this.acl_validator = ACLValidator.create(auth_cfg);
  this.worker_pool.initWorker();
  app.use(context.middleware({
    'acl_validator':self.acl_validator,
    'worker_pool' : self.worker_pool,
    'storagecaller':self.storagecaller
  }));

  var tokenizer = Tokenizer.create(auth_cfg);
  app.use(tokenizer.middleware());
  app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).send('invalid token');
    }
  });

  app.use(require('./ws'));

  app.listen(API_PORT, function () {
    console.log('SS:DATA_API START\t\t[OK]');
  });


}
