# Rosenbot-v2

Bot that announces Twitch streams by selected streamers in your Discord server.

## Set up a Discord bot

To create your own Discord bot, you'll first need to create a bot in your Discord profile. You'll find more info about this [here](https://discord.com/developers/docs/intro).

## Set up your Twitch authentication

More info [here](https://dev.twitch.tv/docs/authentication).

## Install your Discord bot

### Clone this repository

### Add environment variables

Create a file named `.env`. This file will hold secret and confidential Twitch and Discord data and other configurations. \
The Twitch client ID and secret you receive when setting up your Twitch authentication. The webhook secret is a token that you make up yourself, to identify yourself with Twitch. It can be anything but it is recommended to use a secure key. The Discord token you receive when creating the bot. \
The Discord channel ID you get when right clicking on the channel you want to send your announcements to, in your Discord app. Developer mode in your Discord settings must be enabled for this option. \
Your server will be listening for Twitch events on the port you specify. If not specified it will default to 3000. \
The file should look like this (replace the values in the quotation marks):

```
TWITCH_CLIENT_ID="twtich-client-id"
TWITCH_CLIENT_SECRET="super-secret-twitch-secret"
TWITCH_WEBHOOK_SECRET="a-secret-that-you-made-up"
TWITCH_CALLBACK_URL="url-that-twitch-uses-to-send-you-events"
DISCORD_TOKEN="super-secret-discord-token"
DISCORD_CHANNEL_ID="id-of-the-channel-the-bot-should-post-in"
PORT="8080"
```

### Configure streamers

Create a `streamer.json` file which will hold the names of the Twitch streamers you want to announce in your Discord server.\
An example streamers.json would look like this:

```
{
  "PeterPan": null,
  "TinkerBell": null,
  "BigStreamer1": null
}
```

### Install packages

Run `npm install` in the command line of the Rosenbot-v2 directory.

### Start bot

Start the bot by running `npm run start` in the command line of the Rosenbot-v2 directory.

## Host your Discord bot

Following above instructions your bot will only run while the script is running on your device. So it will turn off once you turn off your device.
You will want to either run it via one of the many hosting services the internet has to offer, or on your own server (I only run it for my friends, so I just have it running on a Raspberry Pi.)

## Local development

To test the webhook connection during local development, it is necessary to use a tunnel to a public url so Twitch can send events to your local machine. I used localtunnel for this, which is listed in the dev dependencies. To start the localtunnel enter `npx localtunnel --port 3000` in the console. Make sure to replace the port number if you're not using the default port. It will return the url to your tunnel, which you need to add to the environment variable `TWITCH_CALLBACK_URL`. The tunnel only runs as long as your local server runs, so make sure to start the tunnel first and then start the bot with `npm run start` and remember if your bot stops, you need to restart the tunnel and update the callback url again.

## Other scripts

Following scripts are also available:

- build: `npm run build` - to transpile the code from Typescript to Javascript without starting the bot.
