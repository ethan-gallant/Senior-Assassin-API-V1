const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    return res.json({"data":"Welcome to the SA-API. This API is for private use in the LJCDS Senior Assassin Project."}).end();
});


module.exports = router;
