var mmatch = require("minimatch");

module.exports.create = function(prm)
{
  return new ACLValidator(prm);
}

function ACLValidator(prm)
{
    this.acl = prm.acl;
    if(!Array.isArray(this.acl)){
        this.acl=[];
    }
}

ACLValidator.prototype.appendACL = function(aacl)
{
    if(Array.isArray(aacl))
    {
        this.acl.concat(aacl);
    }
}

ACLValidator.prototype.isAccept = function(tkacl,prm)
{
    var ret=true;
    var chk = {
                "vo":prm.vo||"",
                "service":prm.service||"",
                "resource":prm.resource||"",
                "mode":prm.mode||""
            }
    var the_acl = this.acl;
    if(Array.isArray(tkacl))
    {
        the_acl = this.acl.concat(tkacl);
    }

    the_acl.forEach((rule) => {
        
        if(rulematch(chk,rule) && typeof rule.accept == 'boolean'){
            ret = rule.accept;
        }
    });

    function rulematch(chk,rule)
    {
        var m_vo = (!rule.vo)?true:mmatch(chk.vo,rule.vo);
        var m_service = (!rule.service)?true:mmatch(chk.service,rule.service);
        var m_resource = (!rule.resource)?true:mmatch(chk.resource,rule.resource);
        var m_mode = (!rule.mode)?true:mmatch(chk.mode,rule.mode);
        
        return m_vo && m_service && m_resource && m_mode;
    }

    return ret;
}
