![](./icons/icon.png)

###[DEPRECATED]
### THE SMLOADR.JS integration is for educational purposes and not intended to pirate content
#### This feature is not found on the deployed version

This bot is built on top of the TgFancy framework - a neat and simple Node.Js framework to interact with telegram's bot api. Uses the genius api and scrapes results to send lyrics and also integrates the [SMLoadr.js](https://github.com/mrmazakblu/SMLoader)module for its download song feature. All logs are sent to a firebase backend.

## Usage

#### Initialization

Code expects a couple of environment variables to be set.

- BOT_URL: the url to your bot that appears under messages
- BOT_TOKEN: the token to the bot obtained from botfather
- ARL_COOKIE: the cookie to a logged in deezer instance for downloading music from deezer

Make sure you have stored the configuration json inside the ```/secrets/firebase-config.json```. Once all this are set, run ```npm start``` to get the bot up and running

#### Deployment

The version of SMLoadr.js used in this project has core dependencies of the node 12.x.x version. Make sure the package.json reads so before deployment or unintended bugs might follow.

Running this line should start up the service and have it listen for incoming queries.

```npm install && npm start```.

If you have any suggestions or want to contribute to this project, open up an issue and I'll place you in the authors file.
