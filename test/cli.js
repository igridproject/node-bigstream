#!/usr/bin/env node

var ctx = require('../context');
var repl = require('repl');

var PluginManager = ctx.getLib('lib/plugin/plugin-manager');

var pm = PluginManager.create();
global.pm = pm;
console.log("Entering interactive mode.");
repl.start({
	prompt: "bigstream> ",
	input: process.stdin,
	output: process.stdout
});
