import {
  ChannelType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  TextChannel,
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import { eventEmitter } from './server';
import { TwitchEvent } from './types/twitchTypes';
import { requestStreamerInfo } from './twitch';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '';
export const DISCORD_CLIENT = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
DISCORD_CLIENT.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Load slash commands
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			DISCORD_CLIENT.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

DISCORD_CLIENT.on(Events.InteractionCreate, async (interaction) => {
  
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }
});

DISCORD_CLIENT.on('ready', async () => {
  // Exit if provided channel is not a text channel
  if (DISCORD_CLIENT.channels.cache.get(DISCORD_CHANNEL_ID)?.type !== ChannelType.GuildText) {
    console.error('Discord channel needs to be text channel.');
    return;
  }
  const streamChannel = DISCORD_CLIENT.channels.cache.get(DISCORD_CHANNEL_ID) as TextChannel;

  // Reveive event from webhook in twitch.ts
  eventEmitter.on('stream_start', async (data: TwitchEvent) => {
    const streamerName = data.broadcaster_user_name;
    const streamInfo = await requestStreamerInfo(streamerName)

    if (streamInfo) {
      announceStream(streamInfo.display_name, streamInfo.title, streamInfo.thumbnail_url, streamInfo.game_name);
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
