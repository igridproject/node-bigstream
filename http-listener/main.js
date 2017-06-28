var ctx = require('../context');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var cfg = ctx.config;
var ConnCtx = ctx.getLib('lib/conn/connection-context');
var HttpACL = ctx.getLib('lib/mems/http-acl');
var EvenPub = ctx.getLib('lib/amqp/event-pub');
var QueueCaller = ctx.getLib('lib/amqp/queuecaller');
var EvenSub = ctx.getLib('lib/amqp/event-sub');

const JOBCHANEL = 'bs_job_cmd';
const API_PORT = 19180;

module.exports.create = function(cfg)
{
  var hs = new HTTPListener(cfg);
  return hs;
}

function HTTPListener(cfg)
{
    this.config = cfg;
    this.httpacl = HttpACL.create({'conn':this.config.memstore.url});
    this.jobcaller = new QueueCaller({'url':this.config.amqp.url,'name':'bs_jobs_cmd'});
    this.evs = new EvenSub({'url':this.config.amqp.url,'name':'bs_trigger_cmd'});
    //this.evp = new EvenPub({'url':this.config.amqp.url,'name':JOBCHANEL});
}

HTTPListener.prototype.start = function()
{
  console.log('Starting HTTP Listener ...\n');
  this._http_start();
  this._controller_start();
}

HTTPListener.prototype._http_start = function()
{
  var self = this;

  this.httpacl.update(function(err){
    if(!err){
      console.log('WWW:ACL Update\t\t[OK]');
    }else{
      console.log('WWW:ACL Update\t\t[ERR]');
    }
  });

  app.use(bodyParser.json({limit: '128mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  var context = require('./lib/http-context');
  app.use(context.middleware({
    'httpacl' : self.httpacl,
    'jobcaller' : self.jobcaller
  }));

  app.use(require('./ws'));



  app.listen(API_PORT, function () {
    console.log('WWW:HTTP START\t\t[OK]');
  });

}

HTTPListener.prototype._controller_start = function ()
{
  var self=this;
  var topic = 'ctl.trigger.#';
  self.evs.sub(topic,function(err,msg){
    if(err){
      console.log('WWW:AMQP ERROR Restarting ...');
      setTimeout(function(){
        process.exit(1);
      },5000);
    }
    if(!msg){return;}

    var ctl = msg.data;
    if(ctl.trigger_type != 'http' && ctl.trigger_type != 'all')
    {
      return;
    }

    if(ctl.cmd == 'reload')
    {
      console.log('WWW:Reloading ACL\t[OK]');
      self.reload();
    }

  });
}

HTTPListener.prototype.reload = function ()
{
  var self = this;

  self.httpacl.update(function(err){
    if(!err){
      console.log('WWW:ACL Update\t\t[OK]');
    }else{
      console.log('WWW:ACL Update\t\t[ERR]');
    }
  });
}
