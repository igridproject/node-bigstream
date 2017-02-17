var ctx = require('../context');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var cfg = ctx.config;


module.exports.create = function(cfg)
{
  var hs = new HTTPListener(cfg);
  return hs;
}

function HTTPListener(cfg)
{
    this.config = cfg;

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

  app.use(bodyParser.json({limit: '5mb'}));
  app.use(bodyParser.urlencoded({
      extended: true
  }));


  app.use(require('./ws'));


  app.listen(API_PORT, function () {
    console.log('WWW:HTTP START\t\t[OK]');
  });


}
