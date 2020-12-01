var mysql = require('mysql');

var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;

  var in_type = request.type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta || {};

  var req_host = param.host || "localhost";
  var req_user = param.user || "";
  var req_pass = param.password || "";
  var req_db = param.database || "";
  var req_sql = param.sql || "";

  if(typeof data == 'string' && req_sql == ""){
    req_sql = "${data}"
  }

  var rsql='';
  data.forEach((dat)=>{
    var ev =  {
      'type' : in_type,
      'meta' : meta,
      'data' : dat
    }
    rsql+=Utils.vm_execute_text(ev,req_sql) + ';';
  });

  var conf = {
    "host" : req_host,
    "user" : req_user,
    "password" : req_pass,
    "database" : req_db
  }

  response.meta = meta;
  myexcute(conf,rsql,function(err,result){
    if(!err){
      response.success();
    }else{
      response.error("mysql error");
    }
  });

  //response.success();
  //response.reject();
  //response.error("error message")

}


function myexcute(conf,sql,cb){
  var conn = mysql.createConnection(conf);
  
  conn.connect(function(err) {
    
    if(err) {
      cb(err);
      return console.error('could not connect to mysql', err);
    }
    
    conn.query(sql, function (err, result, fields) {
      var res = {
        "result":result,
        "fields":fields
      }
      cb(err,res);
      conn.destroy();
    });

  });

}

module.exports = perform_function;
