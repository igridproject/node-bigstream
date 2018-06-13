var express = require('express')
  , router = express.Router()

router.use('/v1',require('./v1'));
router.use('/v1.2',require('./v1.2'));

module.exports = router;
