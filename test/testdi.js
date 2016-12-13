var DITask = require('../plugins/di/di-http-request');

var di = new DITask({jobid:'j01'});

di.run();
di.on('done',function(response){
  console.log('>> ' + response.data);
});
