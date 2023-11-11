# Rosenbot-v2

Discord bot with 2 features currently:

- Announcing streams of selected Twitch streamers in your server
- Create polls for your server members

## Set up a Discord bot

Create a bot in your Discord profile. Find more info about this [here](https://discord.com/developers/docs/intro).

## Set up your Twitch authentication

More info [here](https://dev.twitch.tv/docs/authentication).

## Install your Discord bot

### Clone this repository

More info [here](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository).

### Add environment variables

In the source folder, create a file named `.env`. This file will hold confidential configuration data. \
Add the following variables to the `.env` file, replacing the values in quotes.

```
TWITCH_CLIENT_ID="twtich-client-id"
TWITCH_CLIENT_SECRET="super-secret-twitch-secret"
TWITCH_WEBHOOK_SECRET="a-secret-that-you-made-up"
TWITCH_CALLBACK_URL="url-that-twitch-uses-to-send-you-events"
DISCORD_TOKEN="super-secret-discord-token"
DISCORD_CHANNEL_ID="id-of-the-channel-the-bot-should-post-in"
DISCORD_APPLICATION_ID="id-of-your-discord-application"
DB_HOST='localhost'
DB_USER='db-user'
DB_PASSWORD='super-secret-database-password'
DB_NAME='cool-db-name'
PORT='3000'
```

#### Variable explanations

- The Twitch client ID and secret you receive when setting up your Twitch authentication.
- The webhook secret is a token that you make up yourself, to identify yourself with Twitch. It can be anything but it is recommended to use a secure key.
- The Discord token you receive when creating the bot.
- The accouncer will send stream announcement to a dedicated channel. The Discord channel ID you get when right clicking on the channel in your Discord app. Developer mode in your Discord settings must be enabled for this option.
- The Discord application ID is used to register the slash commands. Find it [here](https://support-dev.discord.com/hc/en-us/articles/360028717192-Where-can-I-find-my-Application-Team-Server-ID-).
- This bot uses a MySQL database. To connect to the DB, enter the host, user and password that you reveived when setting up the DB server.
- Your server will be listening for Twitch events on the port you specify. If not specified it will default to 3000.

### Install packages

Run `npm install` in the command line of the Rosenbot-v2 root directory.

### Start bot

Start the bot by running `npm run start` in the command line of the Rosenbot-v2 directory.

### Other scripts

Following scripts are also available:

- build: `npm run build` - to transpile the code from Typescript to Javascript without starting the bot.

## Host your Discord bot

Following above instructions your bot will only run while the script is running on your device. So it will turn off once you turn off your device.
You will want to either run it via one of the many hosting services the internet has to offer, or on your own server (I will run it on Azure).

## Local development

### Local tunnel

To test the webhook connection during local development, it is necessary to use a tunnel to a public url so Twitch can send events to your local machine. I used [localtunnel](https://www.npmjs.com/package/localtunnel) for this, which is listed in the dev dependencies. To start the localtunnel enter `npx localtunnel --port 3000` in the console. Make sure to replace the port number if you're not using the default port. It will return the url to your tunnel, which you need to add to the environment variable `TWITCH_CALLBACK_URL`. The tunnel only runs as long as your local server runs, so make sure to start the tunnel first and then start the bot with `npm run start` and remember if your bot stops, you need to restart the tunnel and update the callback url again.

### Local database

For local development, I used the MySQL workbench. See their documentation [here](https://dev.mysql.com/doc/workbench/en/). An architecture diagram of the tables will follow.

## Bot commands

The bot comes with multiple slash commands in two categories

### Twitch stream announcer

#### add-streamer

Adds a streamer in the database to be announced when they start a stream.

#### list-streamers

List all streamers that have been added to the database.

#### remove-streamer

Remove a streamer from the database.

#### update-subs

Update Streamer subscriptions. Necessary if there where any changes to the callback url or if a subscription got cancelled by Twitch.

### Poll hosting

#### new-poll

Creates a new poll in the database, with the time the poll should run and the poll options.

#### start-poll

Starts a poll, collects and evaluates the reacts to the poll message which are used for voting. Announces the poll result after the poll time.

#### list-polls

Lists all polls in the database.

#### delete-poll

Deletes a poll from the database. Only the poll creator or server owner can delete a poll.
