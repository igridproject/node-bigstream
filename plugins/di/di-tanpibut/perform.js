var request = require('request');
var moment = require('moment');
var cts = moment();

let result = null;
let loopCount = 0;
var param = null;
var continue_state = null;

function execute_function(context,response){
	var job_id = context.jobconfig.job_id;
	var transaction_id = context.transaction_id;
	param = context.jobconfig.data_in.param;
	// var memstore = context.task.memstore;
	var memstore = context.job.memstore;
	var output_type = "object/tanpibut";

	// var data = 'hello world';

	cts = moment().hours(0).minutes(0).seconds(0);
	//console.log("moment cts: " + cts.format("YYYY-MM-DD,HH:mm:ss"));

	result = {
		"object_type": 'tanpibut',
		"station_id": param.station_id,
		"data_type": param.data_type.type,
		"data":[]
	};

	let dtype = param.data_type.type;
	let node_id = param.data_type.node_id;

	memstore.getItem(`${param.station_id}-${dtype}`, function(err, lts){  //latest timestamp, format: yyyy-MM-dd HH:mm:ss
		if (!lts) lts = moment(`${param.init_observed_date} ${param.init_observed_time}`);
		else lts = moment(lts).add(1, 'seconds');

		if(!param.recover){
			let diffdate = cts.diff(lts, 'days') + 1;
			// console.log('diff = ' + diffdate);
			if(diffdate > param.limit){
				lts = moment(cts).add(-(param.limit), 'days');
				// console.log(lts.format("YYYY-MM-DD,HH:mm:ss"))
			}
		}
		
		let url = param.url + `?appkey=${param.appkey}&p=${param.station_id},${node_id},${dtype}`;
		getData(url, lts, dtype, (err) => {
			if(err) {
				console.log(err);
				response.error(err);
			}
			else{
				// console.log("result: " + result);
				if(param.recover && continue_state){
					response.success(result, {"output_type": output_type, "continue": true});
				}
				else {
					response.success(result, {"output_type": output_type});
				}
			}

		});
	}); 



}

function getData(url, lts, dtype, callback) {
	loopCount = 0;
	continue_state = true;
	let req = url + `,${lts.format("YYYY-MM-DD,HH:mm:ss")}`;
	console.log(req);
	requestData(req).then((data) => {
		loopCount++;
		if(data.search('result=""') > -1){
			result.data.push({"value": data});
		}

		if(param.recover){
			if(loopCount >= param.limit){
				result['timestamp'] = lts.hours(23).minutes(55).seconds(0).format("YYYY-MM-DD HH:mm:ss");
				callback();
			}
			else beforeDateCheck(cts, lts);
		}
		else beforeDateCheck(cts, lts);

		function beforeDateCheck(ct, lt){
			if (lt.isBefore(ct, 'days')) {
				lt.add(1, 'days').hours(0).minutes(0).seconds(0);
				req = url + `,${lt.format("YYYY-MM-DD,HH:mm:ss")}`;
				console.log(req);
				requestData(req).then((val) => {
					loopCount++;
					if(val.search('result=""') > -1){
						result.data.push({"value": val});
					}

					if(param.recover){
						if(loopCount >= param.limit){
							result['timestamp'] = lts.hours(23).minutes(55).seconds(0).format("YYYY-MM-DD HH:mm:ss");
							callback();
						}
						else beforeDateCheck(ct, lt);
					}
					else beforeDateCheck(ct, lt);
				}).catch((err) => {
					callback(err);
				});
			}
			else {
				continue_state = false;
				result['timestamp'] = lts.format("YYYY-MM-DD HH:mm:ss");
				callback();
			}
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
