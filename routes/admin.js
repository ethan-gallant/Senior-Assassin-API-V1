const express = require('express');
const router = express.Router();
const studentModel = require('../models/student');
const adminModel = require('../models/admin');

/* GET all the kills pending approval */
router.get('/kills', async (req, res, next) => {
    return res.json({"data": await adminModel.getKillsNeedingApproval()}).end();
});

/* Confirm a kill by the UUID */
router.post('/kills', (req,res,next)=>{
    let uuid = req.body.uuid;
    adminModel.confirmKill(uuid);
    return res.json({"data":"Kill queued"});
});

/* Deny a kill by UUID */
router.delete('/kills/:uuid', (req,res,next)=>{
    let uuid = req.params.uuid;
    adminModel.denyKill(uuid);
    return res.json({"data":"Kill queued"});
});

/* Get a list of all the students with their current targets */
router.get('/students', async (req,res,next)=>{
    return res.json(await studentModel.getAll());
});

module.exports = router;
