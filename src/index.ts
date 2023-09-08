import { ChannelType, Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { eventEmitter } from './server';
import { TwitchEvent } from './types/twitchTypes';
import { getStreamerInfo, removeInvalidSubs, subscribeAll } from './twitch';

const DISCORD_CLIENT = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';

DISCORD_CLIENT.on('ready', async () => {
  
  // Exit if provided channel is not a text channel
  if (DISCORD_CLIENT.channels.cache.get(DISCORD_CHANNEL_ID)?.type !== ChannelType.GuildText) {
    console.error('Discord channel needs to be text channel.');
    return;
  }
  const streamChannel = DISCORD_CLIENT.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel;
  const streamers = await getStreamerInfo();

  await removeInvalidSubs();
  await subscribeAll(streamers);

  // Reveive event from webhook in twitch.ts
  eventEmitter.on('stream_start', async (data: TwitchEvent) => {
    const streamer = streamers[data.broadcaster_user_name.toLowerCase()];
    if (streamer) {
      announceStream(streamer.name, streamer.streamTitle, streamer.thumbnailUrl, streamer.gameName);
    }
  });

  // Announce stream in provided channel
  function announceStream(streamer: string, title: string, logo: string, gameName: string) {
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
});

DISCORD_CLIENT.login(DISCORD_TOKEN);
