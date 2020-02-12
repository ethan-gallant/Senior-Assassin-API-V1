const express = require('express');
const router = express.Router();

const statsModel = require('../models/stats');

/* Fetch the 3 students with the most kills */
router.get('/top/kills', async (req, res, next) => {
    return res.json({"data": await statsModel.getMostKills()}).end();
});

/* Fetch all the dead students with their kill count */
router.get('/dead', async (req, res, next) => {
    return res.json({"data": await statsModel.deadStudents()}).end();
});


module.exports = router;
