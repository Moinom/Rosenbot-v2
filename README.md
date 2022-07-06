# Rosenbot-v2
Bot that announces Twitch streams by selected streamers in your Discord server.

## Set up a Discord bot
To create your own Discord bot, you'll first need to create a bot in your Discord profile. You'll find more info about this [here](https://discord.com/developers/docs/intro).

## Set up your Twitch authentication
More info [here](https://dev.twitch.tv/docs/authentication).

## Install your Discord bot
First clone this repository, then you'll also need to create a config file which will hold the names of the Twitch streamers you want to announce in your Discord server, the channel ID you want to post in, your bot's token and Twitch's oAuth token and link.
An example config.json would look like this:
```
{
  "streamChannelId": 123456789,
  "streamerNames": {
    "exampleNameOne": false,
    "exampleNameTwo": false,
    "exampleNameThree": false
  },
  "oAuthClientId": "twitchClientId",
  "oAuthLink": "twitchAuthLink",
  "discordToken": "secretBotToken"
}
```
Start the bot by running the index.js via node or deploy it via Docker.

## Host your Discord bot
Following above instructions your bot will only run while the script is running on your device. So it will turn off once you turn off your device. 
You will want to either run it via one of the many hosting services the internet has to offer, or on your own server (I only run it for my friends, so I just have it running on a Raspberry Pi.)
