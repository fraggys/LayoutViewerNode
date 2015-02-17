var express = require('express');
var router = express.Router();

/* GET API listing. */
router.get('/new', function(req, res, next) {
    res.send('respond with a resource');
});

/* SET API listing */


module.exports = router;
