
module.exports.create = function(obj)
{
  switch (typeof obj) {
    case 'string':
      return new BSData(obj,'string');
    case 'number':
      return new BSData(obj,'number');
  }

  return new BSData(data,tpy);
}

function BSData(data,type)
{
  this.type = type;
  this.data = data;
}
