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
var cid = null;

var a=0;
var b=0;
for(var i=0;i<1000000000;i++){
  if(i==0){
    a= (new Date()).getTime();
  }else if(i=1000000000-1){
    b=(new Date()).getTime();
    var c = b-a;
    console.log(c);
  }
  //cid = uuid.v4()
  var aid = crypto.randomBytes(12).toString("hex");

  if(aid === cid){
    console.log('cfggg');

  }
  cid=aid;
}

console.log(cid);
