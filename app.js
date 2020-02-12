const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const jwt = require('jsonwebtoken');
// Our helper library for Neo4J sessions
const neodb = require('./neodb');
// Config for out JWT secret
const config = require('./config');

/* Require Our Routers */
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const meRouter = require('./routes/me');
const shopRouter = require('./routes/shop');
const adminRouter = require('./routes/admin');
const statsRouter = require('./routes/stats');
/* Require Models and Init DB */
const student = require('./models/student');
neodb.createSession().then(() => {
    console.log("[Neo4J] Connected to the database")
});

/* JWT Validation Middleware */
const validateJWT = function (req, res, next) {
    // Require JWT Token in the Authorization header
    if (!req.headers || !req.headers.authorization)
        return res.status(403).json({"err": "No authorization header present. Please ensure you are sending the proper authorization header"}).end();
    // Using RFC6750 Bearer authentication we must include Bearer in the content of the header
    jwt.verify(req.headers.authorization.replace("Bearer ", ""), config.jwt.secret, (err, decoded) => {
        if (err) {
            // Log JWT errors in-case there is a renewal error in the frontend
            console.log("[JWT] Validation Error: " + err);
            return res.status(403).json({"err": "The provided JWT failed to validate. Please ensure it is still valid."}).end();
        }
        // Set whether they are admin or not for front-end usage
        req.isadmin = decoded.is_admin || false;
        // Get the model type of the decoded JWT (could be teacher,admin or student)
        //TODO: Implement Teacher login and Individual admin accounts.
        if (decoded.type === "student") {
            student.getByEmail(decoded.email).then((student) => {
                req.usertype = "student";
                req.user = student;
                return next();
            });
        }
    })
};
/* Boolean Methods for Route Handling */
const isAlive = function (req, res, next) {
    if(!req.user.IsDead)
        return next();
    return res.send({"err":"You must be alive to perform this action."})
};

const isStudent = function (req, res, next) {
    if(req.user.usertype !== "student")
        return next();
    return res.send({"err":"You must be alive to perform this action."})
};

const isTeacher = function (req, res, next) {
    if(req.user.usertype !== "teacher")
        return next();
    return res.send({"err":"You must be alive to perform this action."})
};
const isAdmin = function (req, res, next) {
    console.log(req.user);
    if(req.user.is_admin)
        return next();
    return res.send({"err":"You must be an admin to complete that action."})
};

/* CORS for our private API */
const whitelist = ["https://seniorassassin.excl.dev","https://saapi.excl.dev","http://localhost",undefined]; // We use undefined for local testing or unset headers
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            // Log CORS errors into stackdriver in-case of malicious intent
            callback(new Error('Not allowed by CORS'))
        }
    },
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const app = express();

// Enable our CORS middleware
app.use('*', cors(corsOptions));
/* Include our standard ExpressJS libraries */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
/* Include our Routes and Global Middlewares */
app.use('/', indexRouter);
// Endpoint for personal actions for students
//TODO: Implement teachers using the /me endpoint
app.use('/me', validateJWT, isStudent, meRouter);
// Shop endpoint for purchasing game items
app.use('/shop', validateJWT, isStudent, isAlive, shopRouter);
// Admin endpoint for confirming kills
app.use('/admin',validateJWT, isAdmin, adminRouter);
// OAuth routes (Login, Callback)
app.use('/auth', authRouter);
// Stats endpoint for public statistics
app.use('/stats',validateJWT, statsRouter);
// Auth override endpoint for checking a JWT is valid
app.use('/auth/check', validateJWT, (req,res,next)=>{
    return res.json({"data":"success"});
});


module.exports = app;
