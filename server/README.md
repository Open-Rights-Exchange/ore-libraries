# About

A library for protecting an API with the [Open Rights Exchange protocol](https://github.com/Open-Rights-Exchange) 

# Usage

## Server
There are 2 ways to use this library. Both of the methods require verifier public key in the following format in the env file

```
VERIFIER_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMFkw....==\n-----END PUBLIC KEY-----"
```

### As an express middleware
With the verifier public key in the env file, supply an Express-style HTTP handler that services your API. Only valid requests will be served

```javascript
const { oreRequestValidator } = require('@open-rights-exchange/server')

app.use(oreRequestValidator())

```

### As a javascript function from the library
With the verifier public key in the env file, use the checkOreAccessToken function of the library

```javascript
const { oreRequestValidator } = require('@open-rights-exchange/server')

const isValidOreAcessToken = await checkOreAccessToken(req.headers['ore-access-token'], req)
```

# Publish NPM Package

Once published, package name will be:  @open-rights-exchange/server@{version}
