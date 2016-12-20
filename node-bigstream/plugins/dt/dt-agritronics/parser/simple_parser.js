exports.getValues = function(json, callback){
	let dataTemplate = {
		"type": json.xhr.IO.Type,
		"unit": json.xhr.IO.Unit,
		"value_type": json.xhr.IO.ValueType,
		"values": []
	};

	let values = [];
	
	if(typeof json.xhr.IO.Data.length === "undefined"){
		values.push({"observeddatetime": json.xhr.IO.Data.IODateTime, "value": json.xhr.IO.Data.Value});
	}
	else{
		for (var i = 0; i < json.xhr.IO.Data.length; i++) {
			let d = json.xhr.IO.Data[i];
			values.push({"observeddatetime": d.IODateTime, "value": d.Value});
		}
	}
	
	//console.log("values.langth >>>" + values.length);
	if(values.length > 0){
		dataTemplate.values = values;
		callback(dataTemplate);
	}
	else callback(null);
}