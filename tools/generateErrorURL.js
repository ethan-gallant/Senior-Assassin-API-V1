const config = require('../config');

const defaultErrorJSON = {
    title: "Error",
    message: "An unknown error occurred.",
    url: "/",
    button_text: "Return Home"
};

module.exports = (configuration = defaultErrorJSON) => {
    let title = configuration.title ? configuration.title : defaultErrorJSON.title;
    let message = configuration.message ? configuration.message : defaultErrorJSON.message;
    let url = configuration.url ? configuration.url : defaultErrorJSON.url;
    let button_text = configuration.button_text ? configuration.button_text : defaultErrorJSON.button_text;
    return `${config.frontend.url}/error?title=${title}&message=${message}&buttonPath=${url}&buttonMessage=${button_text}`
};