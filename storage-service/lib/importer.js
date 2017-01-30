
module.exports.create =function(prm)
{
  return new importer(prm)
}

function importer(prm)
{

}

importer.prototype.get_data = function(cb)
{
  cb(null,'test');
}
