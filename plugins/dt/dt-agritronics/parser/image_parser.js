var request = require('request').defaults({ encoding: null });;
var async = require('async');

exports.getValues = function(json, cb){
	
	let dataTemplate = {
		"type": json.xhr.IO.Type,
		"unit": json.xhr.IO.Unit,
		"value_type": json.xhr.IO.ValueType,
		"image_type": json.xhr.IO.Name,
		"values": []
	};

	let values = [];
	
	if(typeof json.xhr.IO.Data.length === "undefined"){

		getImage(json.xhr.IO.Data.Value).then((data) =>{
			values.push({"observeddatetime": json.xhr.IO.Data.IODateTime, "value": data});
			if(values.length > 0){
				dataTemplate.values = values;
				cb(dataTemplate);
			}
			else cb(null);
		}).catch((err) => {
			cb(err);
		})
	}
	else{
		var idx = 0;
		async.whilst(function() { return idx < json.xhr.IO.Data.length;}, function(callback) {
			let d = json.xhr.IO.Data[idx];
			idx++;

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
		    } else {
		    	if(values.length > 0){
					dataTemplate.values = values;
					cb(dataTemplate);
				}
				else cb(null);
		    }
		});
		
	}
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