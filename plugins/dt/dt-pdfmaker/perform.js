var vm = require('vm');
var ctx = require('../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

var pdfMake = require('pdfmake/build/pdfmake.js')
var pdfFonts = require('./vfs_fonts.js');
pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.fonts = {
  THSarabunNew : {
          normal: 'THSarabunNew.ttf',
          bold: 'THSarabunNew-Bold.ttf',
          italics: 'THSarabunNew-Italic.ttf',
          bolditalics: 'THSarabunNew-BoldItalics.ttf'
  }
};

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param;
  var memstore = context.task.memstore

  var in_type = request.input_type;
  var in_data = request.data;
  var in_meta = request.meta;

  var mapscr = Utils.parse_script_param(param.script);

  var doc = in_data;
  if(typeof param.document == 'object'){
    doc = param.document;
  }

  if(typeof param.document == 'string'){
    mapscr = mapscr + "; document=" + param.document;
  }

  var mapenv = {
    'src' : {
      'type' : in_type,
      'data' : in_data,
      'meta' : in_meta
    },
    'type' : in_type,
    'data' : in_data,
    'meta' : in_meta,
    'document':doc
  }

  var script = new vm.Script(mapscr);
  var context = new vm.createContext(mapenv);
  script.runInContext(context);

  var meta = mapenv.meta;
  var dd = mapenv.document;
  var output_type = 'binary';

  if(!dd.defaultDtyle){
    dd.defaultStyle = {
      font: 'THSarabunNew'
      }
  }else{
    dd.defaultStyle.font = 'THSarabunNew';
  }

  var pdfDocGenerator = pdfMake.createPdf(dd);
  pdfDocGenerator.getBase64((buf) => {
    var data = Buffer.from(buf,'base64');
    response.success(data,{'meta':meta,'output_type':output_type});
  });


}

module.exports = perform_function;
