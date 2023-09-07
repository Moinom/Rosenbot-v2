import { Client, GatewayIntentBits } from 'discord.js';
import FETCH from 'node-fetch';
import CONFIG from './config.json' assert { type: "json" };

const DISCORD_CLIENT = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

DISCORD_CLIENT.on('ready', () => {
  const streamChannel = DISCORD_CLIENT.channels.cache.get(
    CONFIG.streamChannelId
  );
  console.log('channel id', CONFIG.streamChannelId)
  console.log('channel', streamChannel)
  let allStreamers = CONFIG.streamerNames;

  // loop through all the streamers in config and check their profiles
  function streamerLoop() {
    Object.keys(allStreamers).forEach((key) =>
      findStreamer(key, allStreamers[key])
    );
  }

  // find streamer profile from Twitch API
  async function findStreamer(streamer, wasAnnounced) {
    const url = `https://api.twitch.tv/helix/search/channels?query=${streamer}`;
    const streamObj = await apiCall(url).catch((e) => {
      console.log(e);
    });

    if (!streamObj) {
      return;
    }

    for (let i in streamObj.data) {
      let streamData = streamObj.data[i];
      if (
        streamData &&
        streamData.broadcaster_login == streamer.toLowerCase()
      ) {
        checkStream(streamData, wasAnnounced, streamer);
        return;
      }
    }
  }

  // collect stream info, starts announcer if stream is live
  async function checkStream(streamData, wasAnnounced, streamer) {
    let isLive = streamData.is_live;
    let logo = streamData.thumbnail_url;
    let title = streamData.title;
    let gameId = streamData.game_id;
    let gameName = await getGame(gameId).catch((e) => {
      console.log(e);
    });

    // only run when online and not already announced
    if (isLive && !wasAnnounced) {
      allStreamers[streamer] = true;
      console.log(`${Date.now}: announcing ${streamer}, playing ${gameName}`);
      announceStream(streamer, title, logo, gameName);

      // mark as offline after stream ended
    } else if (!isLive && wasAnnounced) {
      allStreamers[streamer] = false;
    }
  }

  // find out game name
  async function getGame(gameId) {
    const url = `https://api.twitch.tv/helix/games?id=${gameId}`;
    const gameObj = await apiCall(url).catch((e) => {
      console.log(e);
    });

    if (gameObj && gameObj.data[0]) {
      let foundName = gameObj.data[0].name;
      if (foundName) {
        return foundName;
      }
    }
    return 'game name not found';
  }

  // get json object from API
  async function apiCall(url) {
    const token = await getAuthToken().catch((e) => {
      console.log(e);
    });
    let params = {
      method: 'GET',
      headers: {
        'client-id': CONFIG.oAuthClientId,
        Authorization: `Bearer ${token}`,
      },
    };
    let response = await FETCH(url, params).catch((e) => {
      console.log(e);
    });
    let obj = await response.json();

    return obj;
  }

  // generate auth token for API call
  async function getAuthToken() {
    const authResponse = await FETCH(CONFIG.oAuthLink, {
      method: 'POST',
    }).catch((e) => {
      console.log(e);
    });
    const authResJson = await authResponse.json();

    return await authResJson.access_token;
  }

  // announce in discord
  function announceStream(streamer, title, logo, gameName) {
    const lightBlue = 3447003;
    streamChannel.send({
      content: 'Attention, attention! Stream alert! :alarm_clock:',
      embeds: [
        {
          color: lightBlue,
          author: {
            name: streamer,
            icon_url: logo,
          },
          title: `${streamer} is now streaming ${gameName}! Go and watch the stream!`,
          thumbnail: {
            url: logo,
          },
          url: `https://www.twitch.tv/${streamer}`,
          description: title,
        },
      ],
    });
  }

  setInterval(streamerLoop, 30000);
});

DISCORD_CLIENT.login(CONFIG.discordToken);
