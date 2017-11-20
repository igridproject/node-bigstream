var Client = require('ftp');
var async = require('async');
var fs = require('fs');
 
var host ="203.150.19.51";
var port = "21";
var user = "bs";
var pwd = "UF13kczHdCPXpBb";
var main_folder = "GISTDA_SOS_DATA"
var init_observed_date = "2017-10-18";
var init_observed_time = "09:00:00";
var di_plugin = "sftp-filesync";
var data_source = "gistda-air"
var job_path = "/Users/apple/Project@Nectec/i-bitz/jobs/gistda_air_job";
var stationTable = require('hashTable');

var config = {
  host: host,
  port: port,
  user: user,
  password: pwd
};

var c = new Client();

var stationTable = new stationTable();
fs.readFile('/Users/apple/Project@Nectec/i-bitz/data_sample/FromKPrasong/Gistda_Air_Station_Profile.json', function(err, data) {
  if (err) throw err;
  var profile = JSON.parse(data);
  var features = profile.features;
  for (var i=0; i<features.length; i++) {
    var properties = features[i].properties;
    stationTable.put(properties.ftp_folder_mapping, {latitude: properties.lat, longitude: properties.long});
  }
//  var location = stationTable.get('STATION1_KORAT');
});

c.on('ready', function() {
    c.list(main_folder, function(err, list) {
      if (err) throw err;
      async.eachSeries(
        list,
        function(element, callback) {
          // create job profile for .dat
          create_job_profile(element.name, element.name, element.name, false);

          // prepare the image path
          var station_no = element.name;
          station_no = station_no.replace("STATION","");
          var n = station_no.search(/_/i);
          station_no = station_no.substr(0, n);

          var image_path_top = element.name + "/PIC" + station_no + "/TOP" + station_no;
          var filename_top = element.name + "-PIC" + station_no + "-TOP" + station_no;
          create_job_profile(element.name, image_path_top, filename_top, true);

          var image_path_bottom = element.name + "/PIC" + station_no + "/BOTTOM" + station_no;
          var filename_bottom = element.name + "-PIC" + station_no + "-BOTTOM" + station_no;
          create_job_profile(element.name, image_path_bottom, filename_bottom, true);

          console.log(element.name + ", " + image_path_top + " vs " + image_path_bottom);

          callback();
        }
      );
      
    });
});

c.connect(config);


var trigger = {};
trigger["type"] = "cron";
trigger["cmd"] = "0 * * * *";

var param = {};
param["source"] = data_source,
param["url"] = host,
param["port"] = port;
param["user"] = user;
param["password"] = pwd;
param["init_observed_date"] = init_observed_date; 
param["init_observed_time"] = init_observed_time; 

function create_job_profile(station_id, path, filename, is_image) {
  var job = {};
  var job_id = "sds." + data_source + "-" + filename;
  job["job_id"] = job_id;
  job["active"] = true;
  job["trigger"] = trigger;
 
  var location = stationTable.get(station_id);
  var data_in = {};
  data_in["type"] = data_source; 
  var profile = {};
  profile["station_id"] = station_id;
  profile["latitude"] = location.latitude;
  profile["longitude"] = location.longitude;
  data_in["profile"] = profile;
  param["path"] = main_folder + "/" + path;
  data_in["param"] = param;


  if (!is_image) { 
    var data_transform = {};
    data_transform["type"] = data_source; 
  } else {
    var data_transform = [];
    var transfrom1 = {};
    transfrom1["type"] = data_source; 
    var script = {};
    script["script"] = "data=Array.isArray(src.data)?src.data.pop():src.dat";
    var transfrom2 = {};
    transfrom2["type"] = "transform";
    transfrom2["param"] = script;
    data_transform.push(transfrom1);
    data_transform.push(transfrom2);
  }

  var data_out = {};
  data_out["type"] = "storage";
//  data_out["type"] = "dir";
  var data_out_param = {};
  data_out_param["storage_name"] = "sds.gistda-air";
//  data_out_param["path"] = "/Users/Naiyana/testdata";
  data_out["param"] = data_out_param;

  job["data_in"] = data_in;
  job["data_transform"] = data_transform;
  job["data_out"] = data_out;

  fs.writeFile(job_path + "/" + job_id + ".json", JSON.stringify(job), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
  }); 
  
}








