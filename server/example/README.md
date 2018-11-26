## About

This is an example NodeJS Express server 
It uses the server library to check that incoming requests have a valid ore-access-token

You can ore-enable any Express Server by just adding the `oreRequestValidator()` middleware to the express request pipeline.

Or, you can check for a valid token yourself using the `checkOreAccessToken()` function.

## Usage

To run the example server you must have an .env file in the root of the project. 
Copy the .env.example to .env and update the values if needed.
See comments in the code for other usage info.

```
npm install
npm start
```
