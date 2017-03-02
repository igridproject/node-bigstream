var request = require('request');
var async = require('async');
var moment = require('moment');
var cts = moment();

function execute_function(context,response){
	var job_id = context.jobconfig.job_id;
	var transaction_id = context.transaction_id;
	var param = context.jobconfig.data_in.param;
	// var memstore = context.task.memstore;
	var memstore = context.job.memstore;
	var output_type = "object/agritronics";

	var data = 'hello world';

	cts = moment().hours(0).minutes(0).seconds(0);
	//console.log("moment cts: " + cts.format("YYYY-MM-DD,HH:mm:ss"));

	let result = {
		"object_type": 'agritronic',
		"station_id": param.station_id,
		"data":[]
	};

	let idx = 0;
		
	//console.log(json_table.length);
	async.whilst(function() { return idx < param.data_types.length;}, function(callback) {
		let dtype = param.data_types[idx].type;
		let node_id = param.data_types[idx].node_id;

		memstore.getItem(`${param.station_id}-${dtype}`, function(err, lts){  //latest timestamp, format: yyyy-MM-dd HH:mm:ss
			idx++;
			//console.log(`memstore: ${param.station_id}-${dtype} = ${lts}`);
			if (typeof lts === "undefined") lts = moment(`${param.init_observed_date} ${param.init_observed_time}`);
			else lts = moment(lts).add(1, 'seconds');
			//console.log(`memstore: ${param.station_id}-${dtype} = ${lts}`);
			let recvTime = cts.diff(lts, "days");
			if(recvTime > 20) lts = new moment().add(-20, 'day').hours(0).minutes(0).seconds(0);
			//console.log(cts.format("YYYY-MM-DD,HH:mm:ss") + " <<>> " + lts.format("YYYY-MM-DD,HH:mm:ss"));

			let url = param.url + `?appkey=${param.appkey}&p=${param.station_id},${node_id},${dtype}`;
			getData(url, lts, (vals, err) => {
				if(err) {
					callback(err);
				}
				else{
					result.data.push({
						"data_types": dtype,
						"value" : vals
					});	
					callback();
				}
				
				
			});
		}); 
		

	}, function(err) {
	    if( err ) {
	      //response.error(err);
	      response.reject();
	    } else {
	    	//console.log(JSON.stringify(result));
	    	response.success(result, output_type);
	    }
	});


}

function getData(url, lts, callback) {
	let vals = [];
	let req = url + `,${lts.format("YYYY-MM-DD,HH:mm:ss")}`;
	console.log(req);
	requestData(req).then((data) => {
		if(data.search("denied") === -1 && data.search("invalid") === -1 && data.search("no data") === -1){
			vals.push(data);
			beforeDateCheck(cts, lts);
		}

		function beforeDateCheck(ct, lt){
			if (lt.isBefore(ct, 'days')) {
				lt.add(1, 'days').hours(0).minutes(0).seconds(0);
				req = url + `,${lt.format("YYYY-MM-DD,HH:mm:ss")}`;
				console.log(req);
				requestData(req).then((val) => {
					if(val.search("denied") === -1 && val.search("invalid") === -1 && val.search("no data") === -1){
						vals.push(val);
						beforeDateCheck(ct, lt);
					}
				}).catch((err) => {
					callback(err);
				});
			}
			else callback(vals)
		}
	}).catch((err) => {
		callback(err);
	});
}

function requestData(url) {
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
