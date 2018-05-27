//var Jimp = require("jimp");
var async = require('async');
var digitizer = require("./digitizer.js");
var Jimp = require("jimp");

var col_mapping = [
  {"color":[0,0,0],"value":-1},
  {"color":[255,255,255],"value":-1},
  {"color":[0,254,130],"value":5.5},
  {"color":[0,255,0],"value":10},
  {"color":[0,173,0],"value":15},
  {"color":[0,150,50],"value":20},
  {"color":[255,255,0],"value":25},
  {"color":[255,200,3],"value":30},
  {"color":[255,170,0],"value":35},
  {"color":[255,85,0],"value":41},
  {"color":[255,0,0],"value":45},
  {"color":[255,0,100],"value":50},
  {"color":[255,0,255],"value":55},
  {"color":[255,128,255],"value":60},
]

digitizer.avg_point({
  'bg':'img/nck.jpg',
  'fg':'D:\\Project\\radar_nck_process\\obj.jpg',
  'point':[555,492],
  'table':col_mapping,
  'radius':10
},function(err,res){
  console.log(res);
  console.log(__dirname);
})

// var newimage = new Jimp(1600,1600,0x00000000,(err,newimg)=>{
//   newimg.write( "out.png", (err,res)=>{console.log("OK");} )
// });


// Jimp.read("D:\\Project\\radar_nck_process\\base_bg.jpg", function (err, img) {
//     // do stuff with the image (if no exception)
//     img.write( "out.png", (err,res)=>{console.log("OK");} )
// });
//
// Jimp.read("D:\\Project\\radar_nck_process\\obj.jpg", function (err, img) {
//     // do stuff with the image (if no exception)
//     img.write( "out2.png", (err,res)=>{console.log("OK2");} )
// });
// var img = new Jimp("D:\\Project\\radar_nck_process\\base_bg.jpg");
// img.write( "out.png", (err,res)=>{console.log("OK");} )
