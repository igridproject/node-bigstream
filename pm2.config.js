module.exports = {
  "apps" : [{
    "name"        : "bs.storage.write",
    "script"      : "./serv-storage.js",
	  "args"		  : "--process-write"
  },
  {
    "name"        : "bs.storage.read",
    "script"      : "./serv-storage.js",
	  "args"		  : "--process-read",
	  "exec_mode"   : "cluster",
    "instances"   : process.env['BS_NUM_READER']||2
  },
  {
    "name"        : "bs.worker",
    "script"      : "./work-jobworker.js",
    "exec_mode"   : "cluster",
    "instances"   : process.env['BS_NUM_WORKER']||0
  },
  {
    "name"        : "bs.trigger.core",
    "script"      : "./serv-coretrigger.js"
  },
  {
    "name"        : "bs.trigger.httplistener",
    "script"      : "./serv-httplistener.js",
    "exec_mode"   : "cluster",
    "instances"   : process.env['BS_NUM_HTTPLISTENER']||2
  },
  {
    "name"        : "bs.api.service",
    "script"      : "./serv-api.js"
  },
  {
    "name"        : "bs.trigger.nbudp",
    "script"      : "./serv-nbudptrigger.js"
  }]
}