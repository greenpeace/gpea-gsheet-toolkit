var express = require('express');
var router = express.Router();


const gsheetApiRoutes = require('./gsheetapi')

router.get('/', function(req, res, next) {
  res.json({"Hello": "v1"})
});

router.use('/gsheet-db', gsheetApiRoutes)

module.exports = router;
