var express = require('express')
  , router = express.Router()

router.use('/v0.1',require('./v0.1'));
router.use('/v1',require('./v0.1'));
router.use('/v1.1',require('./v1.1'));
router.use('/v1.2',require('./v1.2'));

module.exports = router;
