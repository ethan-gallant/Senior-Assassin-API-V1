const generateErrorURL = require('../tools/generateErrorURL');
const { google } = require('googleapis');
const config = require('../config');
const OAuth2 = google.auth.OAuth2;


const oauth2Client = new OAuth2(
    config.oauth.id,
    config.oauth.secret,
    config.oauth.redirect
);

/* Sets the OAuth clients credentials from response code */
const getOauth2FromCode = async (code) => {
    try {
        // Turn our useless code into a token
        const token = await oauth2Client.getToken(code);
        // Set our client credentials to all provided tokens
        oauth2Client.setCredentials(token.tokens);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

/* Get the user profile JSON from the OAuth2 Client */
const getUserProfile = async () => {
    let oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
    });
    try {
        return await oauth2.userinfo.get();
    } catch (e) {
        console.error(e);
        return null;
    }
};


module.exports = (code) => {
    return new Promise(async (res, rej) => {
        let getOauthGrant = await getOauth2FromCode(code);
        if (!getOauthGrant) {
            console.warn("[OAuth] An OAuth token to key error occurred.");
            return rej(generateErrorURL({
                title: "OAuth Token Error",
                message: "There was an error obtaining your Google OAuth token. Try logging in again and ensure you have granted access to your Google Account information. " +
                    "If this error persists contact support.",
            }));
        }
        let profile_response = await getUserProfile();
        if (!profile_response) {
            console.warn("[OAuth] OAuth token was rejected when attempting to grab user information.");
            return rej(generateErrorURL({
                title: "OAuth Token Rejected",
                message: "There was an error obtaining your Google Profile with the given token. Try logging in again and ensure you have granted access to your Google Account information. " +
                    "If this error persists contact support.",
            }));
        }
        // If the profile is missing info (yeah google does that) we send them an error
        if (typeof profile_response.data.email === 'undefined'
            || typeof profile_response.data.name === 'undefined'
            || !profile_response.data.email
            || !profile_response.data.name
        ) {
            return rej(generateErrorURL({
                title: "Insufficient Profile Information",
                message: "It appears Google did not return your full profile. Please try logging in again and if this error persists, contact support. "
            }));
        } else {
            return res(profile_response.data.email);
        }
    })
};

