const { Client } = require('@open-rights-exchange/client');
// const { Client } = require('../src/client');

const configFile = require("./client_config.json");

const run = async () => {
  try {
    //Initialize the ORE Client with the credentials needed to connect to the ORE blockchain
    let client = new Client(configFile);
    await client.connect();

    //specify the api to call using it's unique name registered on the ORE blockchain
    const apiName = "cloud.hadron.imageRecognize";

    // HOW TO PASS PARAMETERS
    // Pass the parameters for the GET or POST request in as a JSON object 
    // If all the parameters are query parameters (for a GET) or body parameters (for a POST), just pass in the param names
    // However, if some params are query params and some are body params, you must designate both groups as below:
    //
    // "httpBodyParams": {
    //   "imageurl": "https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"
    // },
    // "httpUrlParams": {
    //   "regionCode": "en_us"
    // }

    const params = {
      "imageurl": "https://storage.googleapis.com/partner-aikon.appspot.com/partner-hadron-transferLearning-v1-deepspace.jpg",
    }

    // Ask the client to make the HTTP request. It will construct the HTTP request and add the parameters. 
    // ...it will also add an ore-access-token in the header of the request
    const response = await client.fetch(apiName, params);
    console.log(JSON.stringify(response, null, 2));

  } catch (error) {
    console.error(error);
  }
}

run();
