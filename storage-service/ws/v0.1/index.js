var express = require('express');
var router = express.Router();

router.use('/object',require('./service-object'));
router.use('/storage',require('./service-storage2'));
router.use('/storage2',require('./service-storage2'));

module.exports = router;
