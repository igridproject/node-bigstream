var express = require('express')
  , router = express.Router()

router.use('/',require('./service-main'));

module.exports = router;
