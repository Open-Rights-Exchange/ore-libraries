# About

A library for calling an API that is protected with the [Open Rights Exchange protocol](https://github.com/Open-Rights-Exchange). 

# Usage

## Client

The `client_config.json` is the keyfile which stores the address to connect to the ORE blockchain. It also stores the verifierAuthKey which is used to authrorize verifier to transfer the CPU amount from user's account to API provider's account for the API call. 
You can download a functional version of this file (for your account on the ORE Network) from https://api.market .

IMPORTANT: The verifierAuthKey cannot be used for any other functions such as CPU transfer. It can only be used to authrorize verifier. 

An example configuration file looks like:
```json
{
  "accountName": "ajscf...",
  "verifierAuthKey": "U2Fsd...",
  "verifier": "https...",
  "verifierAccountName": "verif...",
  "instrumentCategory": "apimarket.apiVoucher"
}
```

To call an ORE-enabled API, use the config file, connect to the ORE blockchain and make the request. Here is some fully-functional sample code:

```javascript
const { Client } = require('@open-rights-exchange/client')
const config = require("client_config.json");

//Setup and connect to the blockchain using your wallet and password in the config
let client = new Client(config);
await client.connect()

// call api - passing in the parameters it needs
// you specify the api to call using it's unique name registered on the ORE blockchain
// pass the query parameters as http-url-params and the body parameters as http-body-params if both query and body parameters // exist. Otherwise just pass the parameters to the client.fetch directly.
// example: const params =  {"httpBodyParams": {
//   "imageurl": "https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"
//   },
//   "httpUrlParams": {
//     "env": "staging"
//   }
// }

// if only query or body parameters exist, pass them directly to client.fetch
const params = {"imageurl":"https://console.cloud.google.com/storage/browser/apimarket-contest-2018-07-1-coffee/10465_full_jpg.jpg"}
const response = await client.fetch("cloud.hadron.contest-2018-07", params)

//View results
console.log(response)

```

# Publish NPM Package

Once published, package name will be:  @open-rights-exchange/client@{version}
