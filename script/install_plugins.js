#!/usr/bin/env node

var ctx = require('../context');
var repl = require('repl');

var PluginManager = ctx.getLib('lib/plugin/plugin-manager');

var pm = PluginManager.create();
pm.npm_install_all();
