var request = require('request');
var async = require('async');

function execute_function(context,response){
	var job_id = context.jobconfig.job_id;
	var transaction_id = context.transaction_id;
	var param = context.jobconfig.data_in.param;
	var memstore = context.task.memstore
	var output_type = 'jsonobject'

	var data = 'hello world';

	let result = {
		"station_id": param.station_id,
		"data":[]
	};

	let idx = 0;
		
	//console.log(json_table.length);
	async.whilst(function() { return idx < param.data_types.length;}, function(callback) {
		let dtype = param.data_types[idx].type;
		let node_id = param.data_types[idx].node_id;
		let url = param.url + `?appkey=${param.appkey}&p=${param.station_id},${node_id},${dtype},${param.init_date_observed},${param.init_time_observed}`;
		idx++;
		getData(url).then((data) => {
			if(data.search("denied") === -1){
				result.data.push({
					"data_types": dtype,
					"value" : data
				});
				callback();			
			}
		}).catch((err) => {
			callback(err);
		});

	}, function(err) {
	    if( err ) {
	      response.error(err);
	    } else {
	    	console.log(JSON.stringify(result));
	    	response.success(result, output_type);
	    }
	});


}

function getData(url) {
	return new Promise((resolve, reject) => {
		request(url, function (error, resp, body) {
		    if (!error && resp.statusCode == 200) {
		      resolve(body);
		    }else{
		      return reject(error);
		    }
	  	})
	})
}

module.exports = execute_function;
