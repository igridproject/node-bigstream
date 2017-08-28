var simpleParser = require('./simple_parser');
var windDirParser = require('./wind_direction_parser');
var imageParser = require('./image_parser');

exports.getParser = function(type){
	if(type === "Camera") return imageParser;
	else if(type === "Wind Direction Degree") return windDirParser;
	else return simpleParser;
}