var ctx = require('../context');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var ConnCtx = ctx.getLib('lib/conn/connection-context');
var Tokenizer = ctx.getLib('lib/auth/tokenizer');
var ACLValidator = ctx.getLib('lib/auth/acl-validator');

var jwt = require('express-jwt');

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
  var auth_cfg = this.config.auth;

  app.use(bodyParser.json({limit: '64mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));

  var context = ctx.getLib('lib/ws/http-context');
  this.acl_validator = ACLValidator.create(auth_cfg);
  app.use(context.middleware({
    'conn' : self.conn,
    'acl_validator':self.acl_validator,
    'jobManager' : JobManager.create({'conn' : self.conn}),
    'triggerManager' : TriggerManager.create({'conn' : self.conn})
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
    console.log('Ctl-API:HTTP START\t\t[OK]');
  });
}
