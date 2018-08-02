var BSON = require('buffalo');

module.exports.parse = function(obj)
{

  switch (typeof obj) {
    case 'string':
      var bsobj = JSON.parse(obj);
      var data = bsobj.data;
      if(bsobj.data_type=='binary' && bsobj.encoding=='base64'){
        data = new Buffer(bsobj.data,'base64');
      }
      return new BSData(data,bsobj.data_type);

    case 'object':
      if (obj === null) {
        return null;
      }else if(obj instanceof Buffer){
        var jsonobj = BSON.parse(obj);
        return new BSData(jsonobj.data,jsonobj.data_type);
      }else if( ((obj.object_type && obj.object_type == 'bsdata')||(obj.type && obj.type == 'bsdata'))  && obj.data_type && obj.data){
        var oData = obj.data;
        if(obj.encoding == 'base64'){
          oData = new Buffer(obj.data,'base64');
        }
        return new BSData(oData,obj.data_type);
      }else{
        return null;
      }
    default :
      return null;
  }

}

module.exports.create = function(obj)
{
  switch (typeof obj) {
    case 'string':
      return new BSData(obj,'text');
    case 'number':
      return new BSData(obj.toString(),'text');
    case 'object':
      if (obj === null) {
        return null;
      }else if(obj instanceof Buffer){
        //var encodeStr = obj.toString('base64');
        return new BSData(obj,'binary');
      }else{
        return new BSData(obj,'object');
      }
    default :
      return null;
  }

  return new BSData(data,tpy);
}

function BSData(data,type)
{
  // text|object|binary
  this.type = type;
  this.data = data;
}

BSData.prototype.serialize = function(type){
  var bsdata = {
            'object_type' : 'bsdata',
            'data_type' : this.type,
            'data' : this.data
         };

  if(type=='object'){
    return bsdata;
  }else if(type=='buffer'){
    return BSON.serialize(bsdata);
  }else{
    //text type
    if(this.type == 'binary'){
        //encoding binary data
        bsdata.data = this.data.toString('base64');
        bsdata.encoding = 'base64';
    }

    if(type=='object-encoded'){
      return bsdata;
    }
    return JSON.stringify(bsdata);
  }

}
