var request = require('request').defaults({ encoding: null });;
var async = require('async');
var parser = require('xml2json');

exports.getValues = function(dataSet, cb){
	
	let dataTemplate = {
		"type": "",
		"unit": "",
		"value_type": "",
		"image_type": "",
		"values": []
	};

	let values = [];

	//console.log(dataSet.length);
	let json = parser.toJson(dataSet, {object: true}).xhr.IO;

	dataTemplate.type = json.Type;
	dataTemplate.unit = json.Unit;
	dataTemplate.value_type = json.ValueType;
	dataTemplate.image_type = json.Name;

	if(parseInt(json.Record) > 0){
		if(parseInt(json.Record) === 1){
			getImage(json.Data.Value).then((data) =>{
				dataTemplate.values.push({"observeddatetime": json.Data.IODateTime, "value": data});
				cb(dataTemplate);
			}).catch((err) => {
				cb(err);
			})
		}
		else{
			var idx = 0;
			async.whilst(function() { return idx < json.Data.length;}, function(callback) {
				let d = json.Data[idx];
				idx++;
				//console.log(d.Value);
				getImage(d.Value).then((data) =>{
					values.push({"observeddatetime": d.IODateTime, "value": data});
					//var bitmap = new Buffer(data, 'base64');
					//fs.writeFileSync("./result.jpg", bitmap);
					callback();
					
				}).catch((err) => {
					callback(err);
				});

			}, function(err) {
				if( err ) {
					console.log(err);
					cb(err);
				} 
				if(values.length > 0){
					dataTemplate.values = values;
					cb(dataTemplate);
				}
				else cb(null);
			});
			
		}
	}
	else cb(null);

		



}



function getImage(url) {
	return new Promise((resolve, reject) => {
		request(url, function (error, resp, body) {
			if (!error && resp.statusCode == 200) {
				resolve("data:" + resp.headers["content-type"] + ";base64," + new Buffer(body).toString('base64'));
			}else{
				return reject(error);
			}
		})
	})
}