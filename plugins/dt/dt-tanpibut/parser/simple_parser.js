var parser = require('xml2json');
var idx = 0;

exports.getValues = function(dataSet, callback){
	let dataTemplate = {
		"type": "",
		"unit": "",
		"value_type": "",
		"latitude": "",
      	"longitude": "",
		"values": []
	};

	let values = [];

	let json = parser.toJson(dataSet, {object: true}).xhr.IO;
	dataTemplate.type = json.Type;
	dataTemplate.unit = json.Unit;
	dataTemplate.value_type = json.ValueType;
	dataTemplate.latitude = json.Latitude;
	dataTemplate.longitude = json.Longitude;

	if(parseInt(json.Record) > 0){
		if(parseInt(json.Record) === 1){
			values.push({"observeddatetime": json.Data.IODateTime, "value": json.Data.Value});
		}
		else{
			for (var j = 0; j < json.Data.length; j++) {
				let d = json.Data[j];
				values.push({"observeddatetime": d.IODateTime, "value": d.Value});
			}
		}
	}
		
	

	if(values.length > 0){
		dataTemplate.values = values;
		callback(dataTemplate);
	}
	else callback(null);
	
	
}



// exports.getValues = function(json, callback){
// 	let dataTemplate = {
// 		"type": json.xhr.IO.Type,
// 		"unit": json.xhr.IO.Unit,
// 		"value_type": json.xhr.IO.ValueType,
// 		"values": []
// 	};

// 	let values = [];
	
// 	if(typeof json.xhr.IO.Data.length === "undefined"){
// 		values.push({"observeddatetime": json.xhr.IO.Data.IODateTime, "value": json.xhr.IO.Data.Value});
// 	}
// 	else{
// 		for (var i = 0; i < json.xhr.IO.Data.length; i++) {
// 			let d = json.xhr.IO.Data[i];
// 			values.push({"observeddatetime": d.IODateTime, "value": d.Value});
// 		}
// 	}
	
// 	//console.log("values.langth >>>" + values.length);
// 	if(values.length > 0){
// 		dataTemplate.values = values;
// 		callback(dataTemplate);
// 	}
// 	else callback(null);
// }