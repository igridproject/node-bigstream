var mysql = require('mysql');

var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.task.config.param || {};
  var memstore = context.task.memstore

  var output_type = request.input_type;
  var data = request.data;
  var meta = request.meta || {};

  var req_host = param.host || "localhost";
  var req_port = param.port || "3306"
  var req_user = param.user || "";
  var req_pass = param.password || "";
  var req_db = param.database || "";
  var req_sql = param.sql || "";

  var env = {
    'type' : output_type,
    'data' : data,
    'meta' : meta
  }
 
  if(typeof data == 'string' && req_sql == ""){
    req_sql = "${data}"
  }
  req_sql = Utils.vm_execute_text(env,req_sql);

  //parsing param from meta
  if(typeof meta._param == 'object')
  {
    var _prm = meta._param;
    req_host = (_prm.host)?_prm.host:req_host;
    req_port = (_prm.port)?_prm.host:req_port;
    req_user = (_prm.user)?_prm.user:req_user;
    req_pass = (_prm.password)?_prm.password:req_pass;
    req_db = (_prm.database)?_prm.database:req_db;
    req_sql = (_prm.sql)?_prm.sql:req_sql;
  }

  var conf = {
    "host" : req_host,
    "port" : Number(req_port),
    "user" : req_user,
    "password" : req_pass,
    "database" : req_db
  }

  response.meta = meta;
  myexcute(conf,req_sql,function(err,result){
    if(!err){
      response.success(result,output_type);
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
