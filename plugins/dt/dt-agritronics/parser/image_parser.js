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
	let json = parser.toJson(dataSet, {object: true});

	dataTemplate.type = json.xhr.IO.Type;
	dataTemplate.unit = json.xhr.IO.Unit;
	dataTemplate.value_type = json.xhr.IO.ValueType;
	dataTemplate.image_type = json.xhr.IO.Name;

	if(parseInt(json.xhr.IO.Record) > 0){
		if(parseInt(json.xhr.IO.Record) === 1){
			getImage(json.xhr.IO.Data.Value).then((data) =>{
				dataTemplate.values.push({"observeddatetime": json.xhr.IO.Data.IODateTime, "value": data});
				cb(dataTemplate);
			}).catch((err) => {
				cb(err);
			})
		}
		else{
			var idx = 0;
			async.whilst(function() { return idx < json.xhr.IO.Data.length;}, function(callback) {
				let d = json.xhr.IO.Data[idx];
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
				resolve("data:" + resp.headers["content-type"] + ";base64," + Buffer.from(body).toString('base64'));
			}else{
				return reject(error);
			}
		})
	})
}