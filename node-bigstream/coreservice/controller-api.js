var ctx = require('../context');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var ConnCtx = ctx.getLib('lib/conn/connection-context');
var JobManager = require('./lib/job-manager');
var TriggerManager = require('./lib/trigger-manager')

var API_PORT = 19980;
module.exports.create = function(cfg)
{
  var api = new ControllerAPI(cfg);
  return api;
}

function ControllerAPI(cfg)
{
  this.config = cfg;
  this.conn = ConnCtx.create(this.config);
  this.mem = this.conn.getMemstore()

}

ControllerAPI.prototype.start = function()
{
  console.log('Starting Controller API ...\n');
  this._http_start();
}

ControllerAPI.prototype._http_start = function()
{
  var self = this;

  app.use(bodyParser.json({limit: '128mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  var context = ctx.getLib('lib/ws/http-context');
  app.use(context.middleware({
    'conn' : self.conn,
    'jobManager' : JobManager.create({'conn' : self.conn}),
    'triggerManager' : TriggerManager.create({'conn' : self.conn})
  }));

  app.use(require('./ws'));

  app.listen(API_PORT, function () {
    console.log('Ctl-API:HTTP START\t\t[OK]');
  });
}
