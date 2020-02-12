const express = require('express');
const router = express.Router();

/* IsAlive middleware as some endpoints must be restricted once dead */
const isAlive = function (req, res, next) {
  if(!req.user.dead)
    return next();
  return res.send({"err":"You must be alive to perform this action."})
};

/* GET the users personal info (alive etc) */
router.get('/', (req, res, next) => {
  return res.json(req.user);
});

/* GET the users current target */
router.get('/targets/current', isAlive, async (req,res,next)=>{
  return res.json(await req.user.getCurrentTarget());
});

/* GET all the users targets (including dead) */
router.get('/targets', async (req,res,next)=>{
  return res.json(await req.user.getAllTargets());
});

/* POST a kill on the users current target */
//TODO: Change to a post request as you're changing data
router.get('/submit-kill',isAlive, async (req,res,next)=>{
  let killResponse = await req.user.submitKill();
  if(!killResponse)
    return res.status(400).json({"err":"There is no target currently assigned to the user."});
  return res.json({"data":{url:killResponse}});
});
/* GET the users hired teacher assassin (if they have one) */
router.get('/teacher-assassin',isAlive, async (req,res,next)=>{
  let response = await req.user.getHiredTeacher();
  if(!response)
    // If no teacher is hired return a 404
    return res.status(404).json({"err":"You do not have a teacher hired."});
  return res.json(response);
});

/* GET the assassin that is trying to kill our user (If Assassin is exposed) */
router.get('/expose-assassin',isAlive, async (req,res,next)=>{
  let exposedAssassin = await req.user.exposeAssassin();
  if(!exposedAssassin)
    //TODO: Change to a 404 as its more appropriate
    return res.status(400).json({"err":"No shop purchase was made"});
  return res.json(exposedAssassin);
});

/* Get players personal stats: Kills and Balance */
router.get('/stats',async(req,res,next)=>{
  return res.json({
    balance: req.user.balance,
    kills: await req.user.getKillCount()
  })
});

module.exports = router;
