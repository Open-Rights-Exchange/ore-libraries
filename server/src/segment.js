/*
    Segment is a 3rd party analytics tool 
    To enable logging of usage of this service, register for an account at segment.com then create an access key
    Set the value of SEGMENT_KEY in your .env file
*/

require('dotenv').config()
const Analytics = require('analytics-node');
const base64 = require('base-64');
const { log } = require('./logging');

var analytics;

const segmentKey = process.env.SEGMENT_KEY;
if(segmentKey) {
  try {
    analytics = new Analytics(segmentKey);
  } catch (error) {
    console.log(`Problem initializing Segment: Check SEGMENT_KEY config setting`);
  }
}

module.exports = function analyticsEvent(userId, eventName, eventMetadata={}) {  
    log(eventName, eventMetadata)
    if(analytics) {
      analytics.track({
        event: eventName,
        properties: eventMetadata,
        userId: userId
      });
    }
}

