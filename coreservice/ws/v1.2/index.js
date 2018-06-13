var express = require('express');
var router = express.Router();

router.use('/jobs',require('./ws-jobs'));


module.exports = router;
