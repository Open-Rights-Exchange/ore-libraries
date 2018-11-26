/*
    Rollbar is a 3rd party incident reporting tool. 
    To enable errors or crashes to be posted to it, register for an account at rollbar.com then create an access key
    then base64 encode the key using a command like...
    ... 'base64 yourkey.file | pbcopy' - on a Mac, this copies the base64 encoded value to the clipboard
    Set the value of ROLLBAR_KEY_BASE64_ENCODED in your .env file
*/

require('dotenv').config()
const base64 = require('base-64')
var Rollbar = require('rollbar');

var rollbarExport = () => {};

const rollbarKeyEncoded = process.env.ROLLBAR_KEY_BASE64_ENCODED;
if(rollbarKeyEncoded) {
    try {
        const rollbarConfig = {
            accessToken: base64.decode(rollbarKeyEncoded), 
            captureUncaught: true,
            captureUnhandledRejections: true
        };
        rollbarExport = new Rollbar(rollbarConfig);
    } catch (error) {
        console.log(`Problem initializing Rollbar: Check ROLLBAR_KEY_BASE64_ENCODED config setting`);
    }
}

module.exports = rollbar = rollbarExport;
