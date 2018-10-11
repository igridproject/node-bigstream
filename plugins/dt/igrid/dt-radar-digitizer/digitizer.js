var Jimp = require("jimp");
var async = require('async');

function avg_point(prm,cb)
{
  var bg = prm.bg;
  var fg = prm.fg;
  var dpoint = prm.point;
  var radius = prm.radius || 10;
  var bg_threshold = prm.bg_threshold || 20;
  var mapping_threshold = prm.mapping_threshold || 128;
  var table = prm.table || [];

  async.waterfall([
      p_readbg,
      p_readfg,
      p_process,
  ], function (err, result) {
      cb(err,result);
  });

  function p_readbg(callback) {
    Jimp.read(bg, function (err, img) {
        callback(null, img);
    });
  }
  function p_readfg(ibg, callback) {
      Jimp.read(fg, function (err, img2) {
          callback(null, ibg,img2);
      });
  }


  function p_process(ibg,ifg,callback)
  {

    var w = ifg.bitmap.width;
    var h = ifg.bitmap.height;
    if(!dpoint){dpoint=[Math.floor(w/2),Math.floor(h/2)]}
    var x0 = (dpoint[0]-radius>0)?dpoint[0]-radius:0;
    var y0 = (dpoint[1]-radius>0)?dpoint[1]-radius:0;
    var x1 = (dpoint[0]+radius<w)?dpoint[0]+radius:w;
    var y1 = (dpoint[1]+radius<h)?dpoint[1]+radius:h;

    var sum_point = [];
    var sumwg=0;
    var wg=0;
    var sum=0;
    for(var i=x0;i<=x1;i++){
      for(var j=y0;j<=y1;j++){

        if(pointInCircle(i,j,dpoint[0],dpoint[1],radius)){
          var bpx = Jimp.intToRGBA(ibg.getPixelColor(i, j));
          var fpx = Jimp.intToRGBA(ifg.getPixelColor(i, j));

          //Color Distance threshold
          var pointW = weight(i,j,dpoint[0],dpoint[1],radius);
          wg += pointW;
          if(distance([bpx.r,bpx.g,bpx.b],[fpx.r,fpx.g,fpx.b])>bg_threshold){
            var mv = mapping(table,[fpx.r,fpx.g,fpx.b])
            if(mv.value>0 && mv.distance<mapping_threshold){
              sum_point.push(mv.value);
              sum+=mv.value;
              sumwg+=mv.value*pointW;
            }
          }else{
            sum_point.push(0);
          }
        }

      }
    }

    var avg = (sum_point.length>0)?sum/sum_point.length:0;
    var avgw = (wg>0)?sumwg/wg:0
    var mdn = (sum_point.length>0)?median(sum_point):0;

    callback(null,{'avg':avg,'avgw':avgw,'mdn':mdn});

  }

  function p_process_image(ibg,ifg,callback)
  {

    var w = ibg.bitmap.width;
    var h = ibg.bitmap.height;
    if(!dpoint){dpoint=[Math.floor(w/2),Math.floor(h/2)]}
    var x0 = (dpoint[0]-radius>0)?dpoint[0]-radius:0;
    var y0 = (dpoint[1]-radius>0)?dpoint[1]-radius:0;
    var x1 = (dpoint[0]+radius<w)?dpoint[0]+radius:w;
    var y1 = (dpoint[1]+radius<h)?dpoint[1]+radius:h;

    var newimage = new Jimp(w,h,0x0000FFFF,(err,newimg)=>{
      var sum_point = [];
      for(var i=x0;i<=x1;i++){
        for(var j=y0;j<=y1;j++){
          if(pointInCircle(i,j,dpoint[0],dpoint[1],radius)){
            var bpx = Jimp.intToRGBA(ibg.getPixelColor(i, j));
            var fpx = Jimp.intToRGBA(ifg.getPixelColor(i, j));

            //Channel threshold
            // if(bpx.r-fpx.r > bg_threshold || bpx.g-fpx.g > bg_threshold || bpx.b-fpx.b > bg_threshold){
            //   newimg.setPixelColor(Jimp.rgbaToInt(fpx.r, fpx.g, fpx.b, 255), i, j);
            // }

            //Color Distance threshold
            if(distance([bpx.r,bpx.g,bpx.b],[fpx.r,fpx.g,fpx.b])>bg_threshold){
              newimg.setPixelColor(Jimp.rgbaToInt(fpx.r, fpx.g, fpx.b, 255), i, j);
            }
          }
        }
      }

      callback(null,newimg);
    });

  }

}

function mapping(map_table,color)
{
  var dist = distance([0,0,0],[255,255,255]);
  var out={'value':-1,'distance':dist}

  if(!Array.isArray(map_table)){map_table=[];}
  map_table.forEach((itm)=>{
    if(itm.color && itm.value){
        var d = distance(itm.color,color)
        if(d<out.distance){
          out.value = itm.value;
          out.distance = d;
        }
    }
  });

  return out;
}

function median(values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

function pointInCircle(x, y, cx, cy, radius) {
  var distancesquared = Math.pow(x - cx,2) + Math.pow(y - cy,2);
  return Math.sqrt(distancesquared) <= radius;
}

function weight(x, y, cx, cy,radius) {
  var distancesquared = Math.pow(x - cx,2) + Math.pow(y - cy,2);
  return radius - Math.sqrt(distancesquared);
}

function distance(a,b)
{
  sum = 0;
  sum = Math.pow(a[0] - b[0],2) + Math.pow(a[1] - b[1],2) + Math.pow(a[2] - b[2],2)
  return Math.sqrt(sum)
}

module.exports.avg_point = avg_point;
