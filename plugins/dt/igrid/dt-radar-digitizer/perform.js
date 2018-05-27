var vm = require('vm');
var hash = require('object-hash');
var digitizer = require("./digitizer.js");

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param;
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta || {};

  //Parameters
  var prm_backgroud = param.backgroud;
  var prm_point = param.point;
  var prm_radius = param.radius;
  var prm_table = param.color_mapping || def_table();
  var mapping_threshold = param.mapping_threshold;
  var bg_threshold = param.backgroud_threshold;
  var prefix = param.prefix || 'radar_';

  var bg=null;
  if(prm_backgroud)
  {
    if(typeof prm_backgroud == 'string')
    {
      bg = __dirname + '/img/' + prm_backgroud
    }else if(typeof prm_backgroud == 'object' && prm_backgroud.base64){
      bg = Buffer.from(prm_backgroud, 'base64');
    }
  }

  var fg = data;
  if(typeof data == 'object' && data.base64_data)
  {
    fg = Buffer.from(data, 'base64');
  }

  digitizer.avg_point({
    'bg':bg,
    'fg': fg,
    'point':prm_point,
    'table':prm_table,
    'radius':prm_radius,
    'mapping_threshold':mapping_threshold,
    'bg_threshold ':bg_threshold
  },function(err,res){
    if(!err){
      meta[prefix+'avg'] = res.avg;
      meta[prefix+'median'] = res.mdn;
      response.success(data,{'meta':meta,'output_type':output_type});
    }else{
      response.error(err)
    }
  })

  // memstore.setItem('lasttransaction',transaction_id,function(err){
  //   response.success(data);
  // });

  // memstore.getItem('lasttransaction',function(err,value){
  //   response.success(value);
  // });

  //response.reject();
  //response.error("error message")

}

function def_table()
{
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

  return col_mapping;
}

module.exports = perform_function;
