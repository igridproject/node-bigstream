
module.exports.create = function(data)
{
  var tpy = "object";

  return new BSData(data,tpy);
}

function BSData(data,type)
{
  this.type = type;
  this.data = data;
}
