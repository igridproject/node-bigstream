var parser = require('xml2json');
var idx = 0;

exports.getValues = function(dataSet, callback){
	let dataTemplate = {
		"type": "",
		"unit": "",
		"value_type": "",
		"values": []
	};

	let values = [];


	let json = parser.toJson(dataSet, {object: true}).xhr.IO;
	dataTemplate.type = json.Type;
	dataTemplate.unit = json.Unit;
	dataTemplate.value_type = json.ValueType;
	if(parseInt(json.Record) > 0){
		if(parseInt(json.Record) === 1){
			values.push({"observeddatetime": json.Data.IODateTime, "value": json.Data.Value, "direction": json.Data.Direction});
		}
		else{
			for (var j = 0; j < json.Data.length; j++) {
				let d = json.Data[j];
				values.push({"observeddatetime": d.IODateTime, "value": d.Value, "direction": d.Direction});
			}
		}
	}
	
	if(values.length > 0){
		dataTemplate.values = values;
		callback(dataTemplate);
	}
	else callback(null);


	// async.whilst(() => {return idx < dataSet.length;}, (cb) =>{
	// 	let json = parser.toJson(dataSet[idx], {object: true});
	// 	dataTemplate.type = json.xhr.IO.Type;
	// 	dataTemplate.unit = json.xhr.IO.Unit;
	// 	dataTemplate.value_type = json.xhr.IO.ValueType;
	// 	idx++;
	// 	if(typeof json.xhr.IO.Data.length === "undefined"){
	// 		values.push({"observeddatetime": json.xhr.IO.Data.IODateTime, "value": json.xhr.IO.Data.Value, "direction": json.xhr.IO.Data.Direction});
	// 		process.nextTick(function(){
	// 			cb();	
	// 		})
	// 	}
	// 	else{
	// 		for (var i = 0; i < json.xhr.IO.Data.length; i++) {
	// 			let d = json.xhr.IO.Data[i];
	// 			values.push({"observeddatetime": d.IODateTime, "value": d.Value, "direction": d.Direction});
	// 		}
	// 		process.nextTick(function(){
	// 			cb();	
	// 		})
	// 	}
	// }, function(err) {
	// 	if( err ) {
	// 		console.log(err);
	// 	} else {
	// 		//console.log("values.langth >>>" + values.length);
	// 		if(values.length > 0){
	// 			dataTemplate.values = values;
	// 			callback(dataTemplate);
	// 		}
	// 		else callback(null);
	//     }
	// });
	
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
// 			values.push({"observeddatetime": d.IODateTime, "value": d.Value, "direction": d.Direction});
// 		}
// 	}
	
// 	//console.log("values.langth >>>" + values.length);
// 	if(values.length > 0){
// 		dataTemplate.values = values;
// 		callback(dataTemplate);
// 	}
// 	else callback(null);
// }