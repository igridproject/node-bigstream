var ctx = require('../context');
var BSData = ctx.getLib('lib/model/bsdata');

//var data = new Buffer('hello')
var data = "hello\nworld"

var bsdata = BSData.create(data);

var sel = bsdata.serialize('object');

console.log(sel.data);
