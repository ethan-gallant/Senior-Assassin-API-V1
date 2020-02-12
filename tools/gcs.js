const {Storage} = require('@google-cloud/storage');
const config = require('../config');
const storage = new Storage();

exports.getReadSignedUrl = async (filename) => {
    // Options for allowing 15 minutes of read access to the file
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    // Get a v4 signed URL for reading the file
    const [url] = await storage
        .bucket(config.gcs.bucket)
        .file(filename)
        .getSignedUrl(options);

    return url;
};

exports.getWriteSignedUrl = async (filename) => {
    // Options for allowing 15 minutes of write access to the file
    const options = {
        version: 'v4',
        action: 'write',
        contentType: 'image/jpeg', // We need to specify this for file uploads
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    // Get a v4 signed URL for writing the file
    const [url] = await storage
        .bucket(config.gcs.bucket)
        .file(filename)
        .getSignedUrl(options);

    return url;
};