const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const config = require('../config');
const studentModel = require('../models/student');
const generateErrorURL = require('../tools/generateErrorURL');
const parseOAuthToken = require('../tools/parseOAuthToken');

/* GET home page. */
router.get('/',  (req, res, next)=> {
  res.json({"data":"Base authentication URL for GSuite OAuth"})

});

/* GET a Google OAuth URL with the required scopes and redirect the user */
router.get('/login', (req,res,next)=>{
    const scopes = [
        "email", // To compare against the DB
        "profile" // Required for Email
    ];

    // Set our Google OAuth credentials
    const oauth2Client = new google.auth.OAuth2(
        config.oauth.id,
        config.oauth.secret,
        config.oauth.redirect
    );

    // Generate the URL with our provided parameters
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // We want a refresh token so we need this
        prompt: 'consent',
        scope: scopes // Pass our scopes array in
    });
    // Finally send the user to our generated URL
    res.redirect(url);
});

/* Handle auth callback code form google */
router.get('/callback', async (req,res,next)=>{
    // Use our helper function to parse the token
    parseOAuthToken(req.query.code).then(async (email)=>{
        // Get the student model by email
        let student = await studentModel.getByEmail(email);
        //TODO: Check for multiple user types
        if(!student){
            return res.redirect(generateErrorURL({
                title: "User Not Found",
                message: "We could not find your user in our Database. Please ensure that you have used your LJCDS email when authenticating with Google." +
                    "If you believe this is an error please contact support.",
            }));
        }
        // Create our JWT array
        let jwtData = {
            email: student.email, // Set their Email for authentication
            type: "student", // Set the type of the model we found
            is_admin: student.is_admin // For frontend use only
        };
        // Sign a JWT token away
        let token = await jwt.sign(jwtData, config.jwt.secret);
        // Send them back to the frontend with their new fancy token (We cant use cookies cross domain)
        return res.redirect(`${config.frontend.url}/settoken?token=${token}`).end();
    }).catch((e)=>{
        // If their error is one we generated send the user to the generated page
        if(e.startsWith(config.frontend.url))
            return res.redirect(e);
        else {
            // If we are here, we really screwed something up. StackDriver log it and send them a fatal error page.
            console.error("[Authentication] Unhandled error. It is as follows: " + e);
            return res.redirect(generateErrorURL({
                title: "Fatal Authentication Error",
                message: "There was a fatal authentication error. Please contact support with information on how you got here.",
            }));
        }
    });

});
module.exports = router;
