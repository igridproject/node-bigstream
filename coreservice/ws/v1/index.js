var express = require('express');
var router = express.Router();

router.use('/jobs',require('./service-jobs'));


module.exports = router;
