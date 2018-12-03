const fetch = require('node-fetch')
const Base64 = require('js-base64').Base64;
const ecc = require('eosjs-ecc')
const semver = require('semver');
const NodeCache = require("node-cache");
const hash = require('object-hash');
const {
  Orejs
} = require('@open-rights-exchange/orejs')
const uuidv1 = require('uuid/v1');
const packageJson = require('../package'); //package.json

const requiredNodeVersion = packageJson.engines.node;
const accessTokenCache = new NodeCache();

const DEFAULT_INSTRUMENT_CATEGORY = "apimarket.apiVoucher";
const VERIFIER_APPROVE_PERMISSION = "authverifier";

// if running under a Node application, check node version meets required minimum
if (process.version.length != 0) {
  if (!semver.satisfies(process.version, requiredNodeVersion)) {
    throw new Error(`Required node version ${requiredNodeVersion} not satisfied with current version ${process.version}.`);
  }
}

const TRACING = false //enable when debugging to see detailed outputs

// log data 
function log(message, data) {
  if (TRACING == true) {
    console.log(message, data)
  }
}

class Client {

  constructor(config) {
    this.config = this.validateConfig(config);
  }

  //connect to the ORE blockchain
  connect() {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const {
            oreHttpEndpoint,
            oreChainId
          } = await this.getDetailsFromChain();
          //create instance of orejs
          this.orejs = new Orejs({
            httpEndpoint: oreHttpEndpoint,
            chainId: oreChainId,
            keyProvider: [this.config.decodedVerifierAuthKey.toString()],
            oreAuthAccountName: this.config.accountName,
            sign: true
          });
          await this.validateVerifierAuthKey();
          resolve(this);
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  // Validate and extend config data 
  validateConfig(configData) {
    var {
      accountName,
      verifier,
      verifierAccountName,
      verifierAuthKey,
      instrumentCategory
    } = configData || {};

    if (!accountName || !verifier || !verifierAccountName || !verifierAuthKey) {
      throw new Error(`Problem with config: There is one or more missing required values.`);
    }

    if (!instrumentCategory) {
      configData.instrumentCategory = DEFAULT_INSTRUMENT_CATEGORY
    }

    //verifierAuthKey is base64 encoded
    try {
      configData.decodedVerifierAuthKey = Base64.decode(verifierAuthKey);
    } catch (error) {
      throw new Error(`Problem with config: Couldn't decode the verifierAuthKey : ${error}`);
    }

    return configData;

  }

  /* confirm that verifierAuthKey is a valid private key
    ...and that it belongs to the account name in the config file  */
  async validateVerifierAuthKey() {
    const {
      accountName,
      verifierAuthKey
    } = this.config;
    var verifierAuthPubKey;

    try {
      verifierAuthPubKey = await ecc.privateToPublic(this.config.decodedVerifierAuthKey.toString());
    } catch (error) {
      throw new Error(`Problem with config: VerifierAuthKey (after being decoded) isn't a valid private key.`);
    }
    const isValidKey = await this.orejs.checkPubKeytoAccount(accountName, verifierAuthPubKey);
    if (!isValidKey) {
      throw new Error(`Problem with config: VerifierAuthKey must be a key associated with the provided accountName.`);
    }
  }

  //use verifier discovery endpoint to retrieve ORE node address and chainId
  async getDetailsFromChain() {
    let oreHttpEndpoint, oreChainId;
    //get ORE blockchain URL from verifier discovery endpoint
    var errMsg = `ORE Blockchain: Problem retrieving ORE address from verifier discovery endpoint. Config expects a verifier running here: ${this.config.verifier}.`;
    try {
      const oreNetworkData = await fetch(`${this.config.verifier}/discovery`);
      const {
        oreNetworkUri
      } = await oreNetworkData.json();
      oreHttpEndpoint = oreNetworkUri;
      if (!oreHttpEndpoint) {
        throw new Error(errMsg);
      }
    } catch (error) {
      throw new Error(`${errMsg}: ${error}`);
    }

    //get chainId from ORE blockchain
    errMsg = `ORE Blockchain: Problem retrieving info from the ORE blockchain. Config file expects an ORE node running here: ${oreHttpEndpoint}.`;
    try {
      const oreInfoEndpoint = `${oreHttpEndpoint}/v1/chain/get_info`;
      const oreNetworkInfo = await fetch(oreInfoEndpoint);
      const {
        chain_id
      } = await oreNetworkInfo.json();
      oreChainId = chain_id;
      if (!oreChainId) {
        throw new Error(errMsg);
      }
    } catch (error) {
      throw new Error(`${errMsg}: ${error}`);
    }

    //return data
    return {
      oreHttpEndpoint,
      oreChainId
    };

  }

  // append url/body to the parameter name to be able to distinguish b/w url and body parameters
  getParams(requestParams) {
    let params = {};
    let newKey;
    if (requestParams["http-url-params"] && requestParams["http-body-params"]) {
      Object.keys(requestParams["http-url-params"]).forEach(key => {
        newKey = "urlParam_" + key
        params[newKey] = requestParams["http-url-params"][key]
      });
      Object.keys(requestParams["http-body-params"]).forEach(key => {
        newKey = "bodyParam_" + key
        params[newKey] = requestParams["http-body-params"][key]
      });
      return params;
    } else {
      return requestParams;
    }
  }

  async getOptions(endpoint, httpMethod, oreAccessToken, requestParameters) {
    let options;
    let url;
    url = new URL(endpoint);

    //TODO: Refactor this code so we don't repeat

    //If both url and body params are passed in, add params to query url and body
    if (requestParameters["http-url-params"] && requestParameters["http-body-params"]) {
      Object.keys(requestParameters["http-url-params"]).forEach(key => {
        url.searchParams.append(key, requestParameters["http-url-params"][key])
      });
      options = {
        method: httpMethod,
        body: JSON.stringify(requestParameters["http-body-params"]),
        headers: {
          'Content-Type': 'application/json',
          'Ore-Access-Token': oreAccessToken
        }
      };
    } else {
      //handle passed-in params as body parameters
      if (httpMethod.toLowerCase() === "post") {
        options = {
          method: httpMethod,
          body: JSON.stringify(requestParameters),
          headers: {
            'Content-Type': 'application/json',
            'Ore-Access-Token': oreAccessToken
          }
        }
      } else {
        //handle passed-in params as url query parameters
        options = {
          method: httpMethod,
          headers: {
            'Content-Type': 'application/json',
            'Ore-Access-Token': oreAccessToken
          }
        }
        Object.keys(requestParameters).forEach(key => url.searchParams.append(key, requestParameters[key]))
      }
    }

    return {
      url,
      options
    };

  }

  async getApiVoucherAndRight(apiName) {
    // Call orejs.findInstruments(accountName, activeOnly:true, category:’apiMarket.apiVoucher’, rightName:’xxxx’) => [apiVouchers]
    const apiVouchers = await this.orejs.findInstruments(this.config.accountName, true, this.config.instrumentCategory, apiName)

    // Choose one voucher - rules to select between vouchers: use cheapest priced and then with the one that has the earliest endDate
    const apiVoucher = apiVouchers.sort((a, b) => {
      const rightA = this.orejs.getRight(a, apiName);
      const rightB = this.orejs.getRight(b, apiName);
      return rightA.price_in_cpu - rightB.price_in_cpu || a.instrument.start_time - b.instrument.end_time
    })[apiVouchers.length - 1];

    const apiRight = this.orejs.getRight(apiVoucher, apiName);

    return {
      apiVoucher,
      apiRight
    };
  }

  /* Call Verifier to get access token
     If a request is repeated with the same parameter values (and costs CPU),
     ...then the access token will be returned from a cache to prevent another call to the verifier
  */
  async getUrlAndAccessToken(apiVoucher, apiRight, apiCallPrice, requestParams) {
    let accessToken;
    let cached;
    const params = this.getParams(requestParams);

    // hash the parameter values to be sent to the verifier
    const hashedParams = this.orejs.hashParams(params);

    const cacheKeyParams = Object.assign({}, hashedParams);
    cacheKeyParams["right"] = apiRight.right_name;

    // key for the cached data
    const hashedCacheKey = hash(cacheKeyParams);
    const cachedAccessToken = accessTokenCache.get(hashedCacheKey);

    // check if the accesstoken can be cached
    if (apiCallPrice !== "0.0000 CPU") {
      try {
        accessToken = await this.orejs.getAccessTokenFromVerifier(this.config.verifier, apiVoucher, apiRight, hashedParams);
        cached = false;
      } catch (error) {
        throw new Error(`Internal Server Error: ${error.message}`);
      }
    } else {
      // check if accesstoken for the client request exists in the cache or not 
      if (cachedAccessToken === undefined) {
        try {
          accessToken = await this.orejs.getAccessTokenFromVerifier(this.config.verifier, apiVoucher, apiRight, hashedParams);
        } catch (error) {
          throw new Error(`Internal Server Error: ${error.message}`);
        }
        // set the "time to live" for the cached token to be equal to the accessTokenTimeout of the ore-access-token
        accessTokenCache.set(hashedCacheKey, accessToken, accessToken.accessTokenTimeout);
        cached = false;
      } else {
        accessToken = cachedAccessToken;
        cached = true;
      }
    }
    return {
      accessToken,
      cached
    };

  }

  // Makes request to url (including ore-access-token in header) and returns results
  async callApiEndpoint(endpoint, httpMethod, requestParameters, oreAccessToken) {
    try {
      const {
        url,
        options
      } = await this.getOptions(endpoint, httpMethod, oreAccessToken, requestParameters);
      const response = await fetch(url, options);
      if (response.headers.get('content-type').includes("application/json")) {
        return response.json();
      } else {
        return response.text();
      }
    } catch (error) {
      throw new Error(`Api Endpoint Error: ${error.message}`);
    }
  }

  /* Posts the usage details for a voucher to the verifier
     This is called only when a (zero cost) request is handled by using an ore-access-token in the local cache
     Since the verifier is not called to return the access token, it must have usage updated directly via this approach
  */
  async updateUsageLogAfterCacheUsage(apiVoucherId, rightName, oreAccessToken, apiCallPrice) {
    try {
      await this.orejs.updateUsageLog(this.config.verifier, apiVoucherId, rightName, oreAccessToken, apiCallPrice)
    } catch (error) {
      throw new Error(`Internal Server Error: ${error.message}`);
    }
  }

  /*  
    Calls an rights endpoint with the provided parameters and results results 
    This function request an approval of transfer of CPU (if required) to pay for the request
    It then updates the request to include the ore-access-token returned by the Verifier
    ...as well as any additional parameters required (as specified by the Verifier)
  */
  async fetch(apiName, requestParams) {
    log("Fetch request:", apiName, requestParams);
    const {
      apiVoucher,
      apiRight
    } = await this.getApiVoucherAndRight(apiName);
    log("Fetch request: Active voucher found: ", apiVoucher);
    log("Fetch request: Right to be used: ", apiRight);

    // get CPU balance of the user account
    const apiCallPrice = this.orejs.getAmount(apiRight.price_in_cpu, "CPU");

    if (apiCallPrice != "0.0000 CPU") {
      // Call cpuContract.approve(accountName, cpuAmount) to designate amount to allow payment in cpu for the api call (from priceInCPU in the apiVoucher’s right for the specific endpoint desired)
      const memo = `approve CPU transfer for $(this.config.verifierAccountName + uuidv1()}`;
      log(`Fetch request: Approve ${apiCallPrice} transfer for: ${this.config.verifierAccountName + uuidv1()}`);
      await this.orejs.approveCpu(this.config.accountName, this.config.verifierAccountName, apiCallPrice, memo, VERIFIER_APPROVE_PERMISSION);
      log("Fetch request: CPU approved for the verifier");
    }

    // Call the verifier to get a new access token or get the cached access token
    const {
      accessToken,
      cached
    } = await this.getUrlAndAccessToken(apiVoucher, apiRight, apiCallPrice, requestParams);
    const {
      endpoint,
      oreAccessToken,
      method,
      additionalParameters
    } = accessToken;

    log(`Fetch request: Url:${endpoint}`);
    log(`Fetch request: OreAccessToken ${oreAccessToken}`);

    // Add any additional parameters returned from the verifier that are not already in the request
    if (additionalParameters && additionalParameters.length != 0) {
      Object.keys(additionalParameters).map(key => {
        requestParams[key] = additionalParameters[key]
      });
    }

    // Call the verifier to update usage log if the api call cost is 0 and client is using cached token
    if (cached === true && apiCallPrice === "0.0000 CPU") {
      log(`Fetch request: A cached access token was used - Verifier not called`);
      this.updateUsageLogAfterCacheUsage(apiVoucher.id, apiRight.right_name, JSON.stringify(oreAccessToken), apiCallPrice);
    }

    // Call the api
    const response = await this.callApiEndpoint(endpoint, method, requestParams, oreAccessToken);
    return response;
  }
}

module.exports = {
  Client
}