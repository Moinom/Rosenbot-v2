import { ChannelType, Client, GatewayIntentBits, TextChannel } from 'discord.js';
import CONFIG from './config.json';

const DISCORD_CLIENT = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

interface Streamers {
  [key: string]: boolean;
}

interface Stream {
  data: StreamData[];
  pagination: { cursor: string };
}

interface StreamData {
  broadcaster_language: string;
  broadcaster_login: string;
  display_name: string;
  game_id: string;
  game_name: string;
  id: string;
  is_live: boolean;
  tag_ids: string[];
  tags: string[];
  thumbnail_url: string;
  title: string;
  started_at: string;
}

interface Game {
  data: GameData[];
  pagination: { cursor: string };
}

interface GameData {
  id: string;
  name: string;
  box_art_url: string;
  igdb_id: string;
}

interface TwitchTokenResponse {
  access_token: string;
}

DISCORD_CLIENT.on('ready', () => {
  const streamChannel = DISCORD_CLIENT.channels.cache.get(
    CONFIG.streamChannelId
  ) as TextChannel;
  console.log('channel id', CONFIG.streamChannelId);
  console.log('channel', streamChannel);

  if (streamChannel?.type !== ChannelType.GuildText) {
    console.error('Provided channel is not a text channel.')
    return;
  }
  let allStreamers: Streamers = CONFIG.streamerNames;

  // loop through all the streamers in config and check their profiles
  function streamerLoop() {
    Object.keys(allStreamers).forEach((key) =>
      findStreamer(key, allStreamers[key])
    );
  }

  // find streamer profile from Twitch API
  async function findStreamer(streamer: string, wasAnnounced: boolean) {
    const url = `https://api.twitch.tv/helix/search/channels?query=${streamer}&live_only=true`;
    const streamObj = (await apiCall(url).catch((e) => {
      console.log(e);
    })) as Stream;

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
  async function checkStream(
    streamData: StreamData,
    wasAnnounced: boolean,
    streamer: string
  ) {
    let isLive = streamData.is_live;
    let logo = streamData.thumbnail_url;
    let title = streamData.title;
    let gameId = streamData.game_id;
    let gameName = await getGame(gameId).catch((e) => {
      console.log(e);
    }) || '';

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
  async function getGame(gameId: string) {
    const url = `https://api.twitch.tv/helix/games?id=${gameId}`;
    const gameObj = await apiCall(url).catch((e) => {
      console.log(e);
    }) as Game;

    if (gameObj && gameObj.data[0]) {
      let foundName = gameObj.data[0].name;
      if (foundName) {
        return foundName;
      }
    }
    return 'game name not found';
  }

  // get json object from API
  async function apiCall(url: string) {
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
    let response = await fetch(url, params).catch((e) => {
      console.log(e);
    });
    let obj = await response?.json();

    return obj;
  }

  // generate auth token for API call
  async function getAuthToken() {
    const authResponse = await fetch(CONFIG.oAuthLink, {
      method: 'POST',
    }).catch((e) => {
      console.log(e);
    });
    const authResJson = (await authResponse?.json()) as TwitchTokenResponse;

    return await authResJson.access_token;
  }

  // announce in discord
  function announceStream(streamer: string, title: string, logo: string, gameName: string) {
    const lightBlue = 3447003;
    streamChannel?.send({
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
