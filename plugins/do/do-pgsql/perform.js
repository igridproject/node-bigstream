var pg = require('pg');

var ctx = require('../../../context');
var Utils = ctx.getLib('lib/util/plugin-utils');

function perform_function(context,request,response){
  var job_id = context.jobconfig.job_id;
  var transaction_id = context.transaction.id;
  var param = context.jobconfig.data_out.param;
  var memstore = context.task.memstore;

  var in_type = request.type;
  var data = (Array.isArray(request.data))?request.data:[request.data];
  var meta = request.meta;

  //parameter
  var prm_host = param.host;
  var prm_port = param.port;
  var prm_db = param.database;
  var prm_user = param.username;
  var prm_password = param.password;
  var prm_sql = param.sql;

  var cnf = {}
  if(prm_host){cnf.host=prm_host}
  if(prm_port){cnf.port=prm_port}
  if(prm_db){cnf.database=prm_db}
  if(prm_user){cnf.user=prm_user}
  if(prm_password){cnf.password=prm_password}

  var sql='';
  data.forEach((dat)=>{
    var ev =  {
      'type' : in_type,
      'meta' : meta,
      'data' : dat
    }
    sql+=Utils.vm_execute_text(ev,prm_sql) + ';';
  });

  pgexcute(cnf,sql,function(err){
    if(!err){
      response.success();
    }else{
      response.error("pgsql error");
    }
  });
  //response.success();
  //response.reject();
  //response.error("error message")

}

function pgexcute(conf,sql,callback){
    var client = new pg.Client(conf);
    client.connect(function(err) {
      if(err) {
            callback(err);
            return console.error('could not connect to postgres', err);
      }

      client.query(sql, function(err, result) {
            if(err) {
              callback(err);
              return console.error('error running query', err);
            }
            callback(null,result);
            client.end();
      });
    });
}

function pg_query(conf,sql,callback){

    pg.connect(conf, function(err, client, done) {
       var handleError = function(err) {
        if(!err) return false;
        if(client){
          done(client);
        }
        console.error('pg error ', err);
        callback(err);
        return true;
      };

      if(handleError(err)) return;

      client.query(sql,function(err, result) {
            if(handleError(err)) return;
            done();
            callback(null,result.rows);
      });
    });

}

module.exports = perform_function;
