var queryString = require('query-string');


module.exports.create = create;

function create(resp)
{
    if(resp)
    {
        var rhp = new responseHelper(resp);
        return rhp;
    }else{
        return null;
    }
}

var responseHelper = function(resp)
{
    this.response = resp;
    this.response.set('Access-Control-Allow-Origin','*');
}


function responseResult(data,pg)
{
    var result = data;


    this.response.json(result);
}

responseHelper.prototype.setHeader = function(header){
    this.header = header;
}

responseHelper.prototype.setLastModified = function(lm){
    if(lm){
        this.response.set('Last-Modified',lm);
    }
}

responseHelper.prototype.responseOK = responseResult;

responseHelper.prototype.write = function (data)
{
  this.response.write(data);
}

responseHelper.prototype.endOK = function ()
{
  this.response.status(200).end();
}

responseHelper.prototype.response304 = function(){
    this.response.status(304).send('Not Modified');
}
responseHelper.prototype.response500 = function(){
    this.response.status(500).send('Internal Server Error');
}

responseHelper.prototype.response400 = function(msg){
    if(msg){
        this.response.status(400).json({response:'ERROR',message:msg});
    }else{
        this.response.status(400).send('Bad Request');
    }
}

responseHelper.prototype.response403 = function(msg){
    if(msg){
        this.response.status(403).json({response:'ERROR',message:msg});
    }else{
        this.response.status(403).send('forbidden');
    }
}

responseHelper.prototype.response404 = function(msg){
    if(msg){
        this.response.status(404).json({response:'ERROR',message:msg});
    }else{
        this.response.status(404).send('Not found');
    }
}

responseHelper.prototype.response409 = function(msg){
    if(msg){
        this.response.status(409).json({response:'ERROR',message:msg});
    }else{
        this.response.status(409).send('Conflict');
    }
}

responseHelper.prototype.response201 = function(msg,result){
    var ret = {response:'OK'};
    if(msg){
        ret.message = msg;
    }
    if(result){
        ret.result = result;
    }
    this.response.status(201).json(ret);
}

responseHelper.prototype.response200 = function(result){
    var ret = {response:'OK'};
    if(result){
        ret.result = result;
    }
    this.response.status(200).json(ret);
}
