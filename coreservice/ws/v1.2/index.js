var express = require('express');
var router = express.Router();

router.use('/jobs',require('./ws-jobs'));
router.use('/info',require('./ws-info'));


module.exports = router;
