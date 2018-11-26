/* helper functions 
 */
const hash = require("hash.js")
const TRACING = false //enable when debugging to see detailed outputs

// log data 
function log(message, data) {
    if (TRACING == true) {
        console.log(message, data)
    }
}

// encrypt the values of a json object
function encryptParams(params) {
    var hash = require("hash.js")
    let encryptedParams = {}
    Object.keys(params).map(key => {
        encryptedParams[key] = hash.sha256().update(params[key]).digest('hex')
    })
    return encryptedParams
}

// get balance of an account for a given token symbol
function getTokenAmount(tokenAmount, tokenSymbol = "CPU") {
    try {
        if (typeof tokenAmount === "number") {
            const amount = parseFloat(tokenAmount).toFixed(4)
            return amount.toString() + " " + tokenSymbol
        } else if (typeof tokenAmount === "string") {
            if (tokenAmount.split(" ")[1] === tokenSymbol) {
                return tokenAmount
            } else {
                return parseFloat(tokenAmount).toFixed(4).toString() + " " + tokenSymbol
            }
        } else {
            throw err
        }
    } catch (err) {
        console.info(err)
    }
}

module.exports = {
    log,
    encryptParams,
    getTokenAmount
}