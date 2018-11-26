const { rollbar } = require("./rollbar");

//if traceOnly is true, then this log entry is only created when TRACING_ENABLED (in env) is set to true
function log(message, data, error, traceOnly = false) {
    //only log this when tracing enabled
    if(traceOnly == true && !(TRACING_ENABLED == "true")) {return;}  
    //handle error object
    let err = (error) ? ` - Error: ${error}` : ``;
    let dataString = (data) ? JSON.stringify(data) : '';
    //construct message
    let logMessage = `${message}${dataString}${err}\n`;
    let localLogMessage = `${Date.now()} -${logMessage}`;
    let remoteLogMessage = `${logMessage}`;
    console.log(localLogMessage);
    //Log to Rollbar
    if (typeof rollbar === 'undefined') { // eslint-disable-line no-undef
      return;
    }
    if(error) {
      rollbar.info(remoteLogMessage, {data, level: "error"}); // eslint-disable-line no-undef
    }
    else if(traceOnly == true)  {
      rollbar.info(remoteLogMessage, {data, level: "debug"}); // eslint-disable-line no-undef
    }
    else {
      rollbar.info(remoteLogMessage, {data, level: "info"}); // eslint-disable-line no-undef
    }
  }
  
  function logTrace(message, data) {
    log(message, data, null, true);
  }
  
  function logAndThrowError(message, error){
    logError(message, error);
    throw new Error(message || 'Something broke :(');
  };

  function logError(message, error) {
    log(message, null, error, false);
  }

  module.exports = {
    log,
    logError,
    logTrace,
    logAndThrowError }
  // Log error and throw an error with provided message
  