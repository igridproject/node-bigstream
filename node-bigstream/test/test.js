var ctx = require('../context');
// var BSData = ctx.getLib('lib/model/bsdata');

//var data = new Buffer('hello')
// var data = "hello\nworld"
//
// var bsdata = BSData.create(data);
//
// var sel = bsdata.serialize('object');
//
// console.log(sel.data);

var uuid = require('node-uuid');

// console.log(uuid.v1());
//
const crypto = require("crypto");
//
//
//
// const id = crypto.randomBytes(16).toString("hex");
//
// console.log(id);

var bss_handler = ctx.getLib('storage-service/lib/bss_engine');

var bss = bss_handler.create('d:/testfile/new/slash/hnd.bss');
bss.open(function(err){
  console.log('open');
});
