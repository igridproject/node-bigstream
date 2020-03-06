module.exports.create = function (regis)
{
    return new MemsRegister(regis);
}

function MemsRegister(regis)
{
    this._register = {};
    if(typeof regis == 'object' && regis != null){
        this._register = regis;
    }
}

MemsRegister.prototype.init = function(name,val){
    var value = (val)?val:'';
    if(typeof this._register[name]=='undefined'){
        this._register[name]=value;
    }
}

MemsRegister.prototype.get = function(name){
    if(name){
        return this._register[name];
    }
    return this._register;
}

MemsRegister.prototype.set= function(name,val){
    if(name){
        this._register[name]=val;
    }
}

MemsRegister.prototype.reset= function(name){
    if(name){
        delete this._register[name];
    }else{
        this._register={};
    }
}

MemsRegister.prototype.init_counter = function(name,val){
    if(!name){return;}
    if(typeof this._register[name]!='number'){
        this._register[name]=(typeof val == 'number')?val:0;
    }
}

MemsRegister.prototype.inc = function(name,val){
    if(!name){return;}
    if(typeof val != 'number'){val=1}
    if(typeof this._register[name]!='number'){
        this.init_counter(name);
    }

    this._register[name]+=val;
}