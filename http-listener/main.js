var ctx = require('../context');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var cfg = ctx.config;
var HttpACL = ctx.getLib('lib/mems/http-acl');
var EvenPub = ctx.getLib('lib/amqp/event-pub');

const JOBCHANEL = 'bs_job_cmd';

module.exports.create = function(cfg)
{
  var hs = new HTTPListener(cfg);
  return hs;
}

function HTTPListener(cfg)
{
    this.config = cfg;
    this.httpacl = HttpACL.create({'conn':this.config.memstore.url});
    this.evp = new EvenPub({'url':this.config.amqp.url,'name':JOBCHANEL});
}

HTTPListener.prototype.start = function()
{
  console.log('Starting HTTP Listener ...\n');
  this.http_start();
}

HTTPListener.prototype.http_start = function()
{
  var self = this;

  var API_PORT = 19180;

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
    'evp' : self.evp
  }));

  app.use(require('./ws'));



  app.listen(API_PORT, function () {
    console.log('WWW:HTTP START\t\t[OK]');
  });


}
