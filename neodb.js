const neo4j = require('neo4j-driver');
const config = require('./config.json');

let _driver;

/* Creates a static driver for the application*/
const createSession = async () => {
    if (_driver) {
        console.warn("An attempt to initialize the database was made while it's already initialized.");
        return _driver
    }
    _driver = await neo4j.driver(config.neo4j.uri, neo4j.auth.basic(config.neo4j.user, config.neo4j.password));
    return _driver;
};

/* Get a session from the static driver */
const getSession = () => {
    if(!_driver)
        console.log("Session was attempted to be grabbed although it was unavailable. Possibly not initialized?");
    return _driver.session();
};

/* Kill the driver */
const terminateSession = async () => {
    if(_driver)
        await _driver.close();
};

module.exports = {
    createSession,
    getSession,
    terminateSession
};