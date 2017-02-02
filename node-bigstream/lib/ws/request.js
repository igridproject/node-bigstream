var dateFormat = require('dateformat');

module.exports.create = create;

function create(req)
{
    if(req)
    {
        var rqhp = new requestHelper(req);
        return rqhp;
    }else{
        return null;
    }
}

var requestHelper = function(req)
{
    this.request= req;
}


requestHelper.prototype.getRequest = function() {
    return this.request;
};
requestHelper.prototype.getHeaders= function() {
    return this.request.headers;
};
requestHelper.prototype.getQuery = function() {
    return this.request.query;
};
