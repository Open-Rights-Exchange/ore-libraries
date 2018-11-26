/*
    Example server demonstrating Open Rights Exchange middleware
*/

const dotenv = require('dotenv');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const { oreRequestValidator } = require('@open-rights-exchange/server');
//const { oreRequestValidator } = require('../src/server');

dotenv.config();
const PORT = process.env.PORT || 8080;

const app = express();
var counter = 0;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

// This middleware confirms that the incoming request is valid. It checks:
// 1) Request Header includes an ore-access-token signed by a valid Verifier key
// 2) Request parameters match those authorized by the verfier (and encoded by hash in the ore-access-token)
// 3) The ore-access-token hasn't expired
// If any checks above fail, an error will be returned and the request aborted
app.use(oreRequestValidator());

// As an alternative to using the middleware, you can call checkOreAccessToken(req.headers['ore-access-token']) 
// ...It will return true if all is good or throw an error otherwise

// Handle 'count' route
app.post('/count', handleCount);

// Handle all other routes by returing a 404 - Not Found
app.use(function (req, res, next) {
    var err = new Error(`Route not found`);
    err.status = 404;
    next(err);
})

//Example function - just increments a counter by 'incrementBy' passed-in as body parameter
async function handleCount(req, res) {
    const incrementBy = (req.body && req.body.incrementBy) ? parseInt(req.body.incrementBy) : 1;
    counter += incrementBy;
    res.json({counter});
}

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
