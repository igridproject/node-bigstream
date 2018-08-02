var jwt = require('express-jwt');

module.exports.create = function(cfg)
{
  return new Tokenizer(cfg);
}

module.exports.info = function(tok)
{
    var ret = {}
    if(!tok){
        ret = {"vo":"",acl:""}
    }else{
        ret = {
            "vo":tok.vo || "",
            "acl":tok.acl || []
        }
    }

  return ret;
}

function Tokenizer(cfg)
{
    //this.config = cfg;
    this.cfg_auth = cfg
}

Tokenizer.prototype.getJWTSecret = function()
{
    if(process.env.BS_SECRET)
    {
        return {'type':'env','value':process.env.BS_SECRET};
    }else{
        return this.cfg_auth.secret;
    }
}

Tokenizer.prototype.middleware = function()
{
    var self = this;
    var jt = jwt({
        secret: self.getJWTSecret().value,
        requestProperty: 'auth',
        credentialsRequired: false,
        getToken: function fromHeaderOrQuerystring (req) {
          if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
              return req.headers.authorization.split(' ')[1];
          } else if (req.query && req.query.token) {
            return req.query.token;
          }
          return null;
        }
      });
    return jt;
}