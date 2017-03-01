var express = require('express');
var router = express.Router();

router.use('/object',require('./service-object'));
router.use('/storage',require('./service-storage'));


module.exports = router;
